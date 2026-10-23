import { nameFromDomain, normalizeDomain } from './domain'

describe('normalizeDomain', () => {
  it.each([
    ['https://www.Netflix.com/login', 'netflix.com'],
    ['netflix.com', 'netflix.com'],
    ['accounts.spotify.com', 'spotify.com'],
    ['http://m.facebook.com/home.php', 'facebook.com'],
    ['mercadolibre.com.ar', 'mercadolibre.com.ar'],
    ['  GitHub.com  ', 'github.com'],
  ])('normaliza %s → %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected)
  })

  it.each(['', 'no es un dominio', 'android://hash@com.netflix', 'http://192.168.0.1', 'localhost:3000'])(
    'descarta %p',
    (input) => {
      expect(normalizeDomain(input)).toBeNull()
    },
  )

  it('no recorta el prefijo si dejaría un dominio sin TLD', () => {
    expect(normalizeDomain('app.io')).toBe('app.io')
  })
})

describe('nameFromDomain', () => {
  it('capitaliza la primera etiqueta', () => {
    expect(nameFromDomain('letterboxd.com')).toBe('Letterboxd')
  })
})
