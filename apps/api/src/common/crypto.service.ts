import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'crypto'

const VERSION = 'v1'
const IV_BYTES = 12

/**
 * Cifrado en reposo del mapa de cuentas (AES-256-GCM) y hashes deterministas
 * (HMAC-SHA256) para deduplicar y buscar sin guardar el dato en claro.
 * Las dos claves se derivan de ENCRYPTION_KEY con HKDF para no reutilizar la misma.
 */
@Injectable()
export class CryptoService {
  private readonly encKey: Buffer
  private readonly macKey: Buffer

  constructor(config: ConfigService) {
    const master = Buffer.from(config.getOrThrow<string>('ENCRYPTION_KEY'), 'base64')
    this.encKey = Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), 'borrar:enc', 32))
    this.macKey = Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), 'borrar:mac', 32))
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv('aes-256-gcm', this.encKey, iv)
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':')
  }

  decrypt(sealed: string): string {
    const [version, iv, tag, data] = sealed.split(':')
    if (version !== VERSION || !iv || !tag || !data) throw new Error('Formato de dato cifrado desconocido')
    const decipher = createDecipheriv('aes-256-gcm', this.encKey, Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
  }

  encryptJson(value: unknown): string {
    return this.encrypt(JSON.stringify(value))
  }

  decryptJson<T>(sealed: string): T {
    return JSON.parse(this.decrypt(sealed)) as T
  }

  hmac(value: string): string {
    return createHmac('sha256', this.macKey).update(value).digest('base64url')
  }

  safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    return ab.length === bb.length && timingSafeEqual(ab, bb)
  }
}
