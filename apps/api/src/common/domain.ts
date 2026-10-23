const STRIP_PREFIXES = ['www.', 'm.', 'mobile.', 'login.', 'accounts.', 'account.', 'auth.', 'signin.', 'secure.', 'app.']

/**
 * Normaliza lo que el usuario pega o importa ("https://www.Netflix.com/login",
 * "netflix.com", "android://...@com.netflix") a un dominio comparable.
 * Devuelve null si no parece un dominio.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (!value) return null
  if (value.startsWith('android://')) return null

  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = `https://${value}`
  let host: string
  try {
    host = new URL(value).hostname
  } catch {
    return null
  }

  host = host.replace(/\.$/, '')
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null
  if (/^\d+(\.\d+){3}$/.test(host) || host === 'localhost') return null

  for (const prefix of STRIP_PREFIXES) {
    if (host.startsWith(prefix) && host.split('.').length > 2) {
      host = host.slice(prefix.length)
      break
    }
  }
  return host
}

/** Nombre legible a partir del dominio cuando el servicio no está en el catálogo. */
export function nameFromDomain(domain: string): string {
  const label = domain.split('.')[0] ?? domain
  return label.charAt(0).toUpperCase() + label.slice(1)
}
