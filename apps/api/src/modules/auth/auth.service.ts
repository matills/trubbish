import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { sql } from 'drizzle-orm'
import type Redis from 'ioredis'
import { randomInt } from 'crypto'
import type { RequestCodeResponse } from '@borrar/shared'
import { REDIS } from '../../common/common.module'
import { CryptoService } from '../../common/crypto.service'
import type { SessionUser } from '../../common/auth'
import { DRIZZLE, type Database } from '../../database/database.module'
import { users } from '../../database/schema'
import { MailService } from '../mail/mail.service'

export const CODE_TTL_SECONDS = 600
const MAX_REQUESTS_PER_HOUR = 5
const MAX_ATTEMPTS = 5

/**
 * Verificación de titularidad: el código que llega al correo es a la vez el
 * login. No hay contraseñas en ningún punto del producto.
 */
@Injectable()
export class AuthService {
  private readonly exposeDevCode: boolean

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.exposeDevCode = config.get('NODE_ENV') !== 'production' && !config.get('SMTP_URL')
  }

  async requestCode(email: string): Promise<RequestCodeResponse> {
    const key = this.crypto.hmac(email)
    const requests = await this.redis.incr(`auth:req:${key}`)
    if (requests === 1) await this.redis.expire(`auth:req:${key}`, 3600)
    if (requests > MAX_REQUESTS_PER_HOUR) {
      throw new HttpException('Pediste demasiados códigos. Probá de nuevo en una hora.', HttpStatus.TOO_MANY_REQUESTS)
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
    await this.redis
      .multi()
      .set(`auth:code:${key}`, this.crypto.hmac(`${email}:${code}`), 'EX', CODE_TTL_SECONDS)
      .del(`auth:att:${key}`)
      .exec()
    await this.mail.sendVerificationCode(email, code)

    return { expiresInSeconds: CODE_TTL_SECONDS, ...(this.exposeDevCode ? { devCode: code } : {}) }
  }

  async verifyCode(email: string, code: string): Promise<{ token: string; user: SessionUser }> {
    const key = this.crypto.hmac(email)
    const stored = await this.redis.get(`auth:code:${key}`)
    if (!stored) throw new BadRequestException('El código venció o no existe. Pedí uno nuevo.')

    const attempts = await this.redis.incr(`auth:att:${key}`)
    if (attempts === 1) await this.redis.expire(`auth:att:${key}`, CODE_TTL_SECONDS)
    if (attempts > MAX_ATTEMPTS) {
      await this.redis.del(`auth:code:${key}`, `auth:att:${key}`)
      throw new HttpException('Demasiados intentos. Pedí un código nuevo.', HttpStatus.TOO_MANY_REQUESTS)
    }

    if (!this.crypto.safeEqual(stored, this.crypto.hmac(`${email}:${code}`))) {
      throw new BadRequestException('Código incorrecto')
    }
    await this.redis.del(`auth:code:${key}`, `auth:att:${key}`)

    const [user] = await this.db
      .insert(users)
      .values({ email, lastLoginAt: new Date() })
      .onConflictDoUpdate({ target: users.email, set: { lastLoginAt: sql`now()` } })
      .returning({ id: users.id, email: users.email })
    if (!user) throw new Error('No se pudo crear el usuario')

    const token = await this.jwt.signAsync({ sub: user.id, email: user.email })
    return { token, user }
  }
}
