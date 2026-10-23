/**
 * Lectura del CSV de contraseñas exportado por el navegador, 100% en el cliente.
 *
 * Regla de negocio 2: de cada fila se toma SOLO la columna del sitio. Usuario,
 * contraseña y notas no se copian a ninguna variable que sobreviva a la función:
 * el resultado es una lista de hosts y nada más.
 */

const URL_COLUMNS = ['url', 'origin', 'website', 'login_uri', 'hostname', 'site']
const NAME_COLUMNS = ['name', 'title']

export interface BrowserSite {
  host: string
  name: string | null
}

export interface ParsedExport {
  sites: BrowserSite[]
  rows: number
  /** Filas sin un sitio web reconocible (apps de Android, IPs, vacías). */
  ignored: number
}

/** Parser CSV mínimo (RFC 4180): comillas, comillas escapadas y saltos de línea dentro de campos. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function hostFrom(value: string): string | null {
  const raw = value.trim()
  if (!raw || raw.startsWith('android://')) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (!host.includes('.') || /^\d+(\.\d+){3}$/.test(host)) return null
    return host
  } catch {
    return null
  }
}

export function parseBrowserExport(text: string): ParsedExport {
  const [header, ...body] = parseCsv(text)
  if (!header) throw new Error('El archivo está vacío')
  const cols = header.map((h) => h.trim().toLowerCase())
  const urlIdx = cols.findIndex((c) => URL_COLUMNS.includes(c))
  if (urlIdx === -1) throw new Error('No encontramos la columna de sitios. ¿Es el CSV exportado por el navegador?')
  const nameIdx = cols.findIndex((c) => NAME_COLUMNS.includes(c))

  const byHost = new Map<string, BrowserSite>()
  let ignored = 0
  for (const cells of body) {
    const host = hostFrom(cells[urlIdx] ?? '')
    if (!host) {
      ignored++
      continue
    }
    if (!byHost.has(host)) {
      const name = nameIdx >= 0 ? (cells[nameIdx]?.trim() ?? '') : ''
      byHost.set(host, { host, name: name && name !== host ? name : null })
    }
  }
  return {
    sites: [...byHost.values()].sort((a, b) => a.host.localeCompare(b.host)),
    rows: body.length,
    ignored,
  }
}
