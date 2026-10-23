import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import { CryptoService } from './crypto.service'

function makeService(key = randomBytes(32).toString('base64')) {
  return new CryptoService({ getOrThrow: () => key } as unknown as ConfigService)
}

describe('CryptoService', () => {
  it('cifra y descifra sin perder datos', () => {
    const crypto = makeService()
    const sealed = crypto.encryptJson({ domain: 'netflix.com', notes: 'ñandú' })
    expect(sealed).not.toContain('netflix')
    expect(crypto.decryptJson(sealed)).toEqual({ domain: 'netflix.com', notes: 'ñandú' })
  })

  it('usa un IV distinto en cada cifrado', () => {
    const crypto = makeService()
    expect(crypto.encrypt('x')).not.toBe(crypto.encrypt('x'))
  })

  it('rechaza un dato manipulado', () => {
    const crypto = makeService()
    const parts = crypto.encrypt('secreto').split(':')
    parts[3] = Buffer.from('otro').toString('base64')
    expect(() => crypto.decrypt(parts.join(':'))).toThrow()
  })

  it('no descifra con otra clave', () => {
    const sealed = makeService().encrypt('secreto')
    expect(() => makeService().decrypt(sealed)).toThrow()
  })

  it('el hmac es determinista para la misma clave', () => {
    const key = randomBytes(32).toString('base64')
    expect(makeService(key).hmac('a')).toBe(makeService(key).hmac('a'))
    expect(makeService(key).hmac('a')).not.toBe(makeService().hmac('a'))
  })
})
