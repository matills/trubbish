import { describe, expect, it } from 'vitest'
import { parseBrowserExport, parseCsv } from './browser-csv'

const CHROME = [
  'name,url,username,password,note',
  'netflix.com,https://www.netflix.com/login,ana@ejemplo.com,s3cr3t-Netflix,',
  'Spotify,https://accounts.spotify.com/es/login,ana,"pa,ss""word",nota',
  'netflix.com,https://netflix.com/,otra@ejemplo.com,otra-clave,',
  'app,android://hash@com.whatsapp/,123,clave-android,',
  'router,http://192.168.0.1/,admin,admin,',
].join('\r\n')

const FIREFOX = [
  '"url","username","password","httpRealm","formActionOrigin","guid","timeCreated","timeLastUsed","timePasswordChanged"',
  '"https://letterboxd.com","ana","clave-firefox",,"https://letterboxd.com","{x}","1","1","1"',
].join('\n')

const SAFARI = ['Title,URL,Username,Password,Notes,OTPAuth', 'Steam,https://store.steampowered.com/,ana,clave-safari,,'].join('\n')

describe('parseCsv', () => {
  it('respeta comillas, comas y comillas escapadas', () => {
    expect(parseCsv('a,"b,c","d""e"\n1,2,3')).toEqual([
      ['a', 'b,c', 'd"e'],
      ['1', '2', '3'],
    ])
  })
})

describe('parseBrowserExport', () => {
  it('extrae hosts únicos del CSV de Chrome', () => {
    const res = parseBrowserExport(CHROME)
    expect(res.sites.map((s) => s.host)).toEqual(['accounts.spotify.com', 'netflix.com'])
    expect(res.rows).toBe(5)
    expect(res.ignored).toBe(2)
  })

  it('nunca devuelve usuarios ni contraseñas', () => {
    const serialized = JSON.stringify([parseBrowserExport(CHROME), parseBrowserExport(FIREFOX), parseBrowserExport(SAFARI)])
    for (const secret of ['s3cr3t', 'pa,ss', 'otra-clave', 'clave-firefox', 'clave-safari', 'ana@ejemplo.com']) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('lee los formatos de Firefox y Safari', () => {
    expect(parseBrowserExport(FIREFOX).sites[0]?.host).toBe('letterboxd.com')
    expect(parseBrowserExport(SAFARI).sites[0]).toEqual({ host: 'store.steampowered.com', name: 'Steam' })
  })

  it('falla con un CSV que no es del navegador', () => {
    expect(() => parseBrowserExport('a,b\n1,2')).toThrow(/columna de sitios/)
  })
})
