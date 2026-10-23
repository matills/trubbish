import { BadRequestException, HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomBytes } from 'crypto'
import type Redis from 'ioredis'
import { CryptoService } from '../../common/crypto.service'
import type { Database } from '../../database/database.module'
import type { MailService } from '../mail/mail.service'
import { AuthService } from './auth.service'

/** Redis en memoria con lo justo que usa AuthService. */
function fakeRedis() {
  const store = new Map<string, string>()
  const redis = {
    store,
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    incr: jest.fn(async (k: string) => {
      const n = Number(store.get(k) ?? 0) + 1
      store.set(k, String(n))
      return n
    }),
    expire: jest.fn(async () => 1),
    del: jest.fn(async (...keys: string[]) => keys.forEach((k) => store.delete(k))),
    multi: jest.fn(() => {
      const ops: Array<() => void> = []
      const tx = {
        set: (k: string, v: string) => (ops.push(() => store.set(k, v)), tx),
        del: (k: string) => (ops.push(() => store.delete(k)), tx),
        exec: async () => ops.forEach((op) => op()),
      }
      return tx
    }),
  }
  return redis
}

function setup(env: Record<string, string | undefined> = {}) {
  const config = {
    get: (k: string) => ({ NODE_ENV: 'test', ...env })[k],
    getOrThrow: () => randomBytes(32).toString('base64'),
  } as unknown as ConfigService
  const redis = fakeRedis()
  const mail = { sendVerificationCode: jest.fn(async () => undefined) }
  const returning = jest.fn(async () => [{ id: 7, email: 'ana@ejemplo.com' }])
  const db = {
    insert: () => ({ values: () => ({ onConflictDoUpdate: () => ({ returning }) }) }),
  } as unknown as Database
  const jwt = { signAsync: jest.fn(async () => 'token') } as unknown as JwtService
  const service = new AuthService(db, redis as unknown as Redis, new CryptoService(config), mail as unknown as MailService, jwt, config)
  return { service, redis, mail }
}

describe('AuthService', () => {
  it('manda el código por la cola y no guarda el código en claro', async () => {
    const { service, redis, mail } = setup()
    const res = await service.requestCode('ana@ejemplo.com')
    const sentCode = (mail.sendVerificationCode.mock.calls[0] as unknown as [string, string])[1]

    expect(sentCode).toMatch(/^\d{6}$/)
    expect(res.devCode).toBe(sentCode)
    expect([...redis.store.values()].some((v) => v.includes(sentCode))).toBe(false)
  })

  it('no expone el código si hay SMTP configurado', async () => {
    const { service } = setup({ SMTP_URL: 'smtp://x' })
    expect((await service.requestCode('ana@ejemplo.com')).devCode).toBeUndefined()
  })

  it('verifica el código correcto una sola vez', async () => {
    const { service } = setup()
    const { devCode } = await service.requestCode('ana@ejemplo.com')
    await expect(service.verifyCode('ana@ejemplo.com', devCode!)).resolves.toMatchObject({ token: 'token' })
    await expect(service.verifyCode('ana@ejemplo.com', devCode!)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rechaza un código incorrecto y bloquea tras 5 intentos', async () => {
    const { service } = setup()
    const { devCode } = await service.requestCode('ana@ejemplo.com')
    const wrong = devCode === '000000' ? '111111' : '000000'
    for (let i = 0; i < 5; i++) {
      await expect(service.verifyCode('ana@ejemplo.com', wrong)).rejects.toBeInstanceOf(BadRequestException)
    }
    await expect(service.verifyCode('ana@ejemplo.com', devCode!)).rejects.toBeInstanceOf(HttpException)
  })

  it('limita a 5 pedidos de código por hora', async () => {
    const { service } = setup()
    for (let i = 0; i < 5; i++) await service.requestCode('ana@ejemplo.com')
    await expect(service.requestCode('ana@ejemplo.com')).rejects.toBeInstanceOf(HttpException)
  })
})
