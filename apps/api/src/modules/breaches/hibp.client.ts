import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'crypto'
import type { Breach } from '@borrar/shared'

interface HibpBreach {
  Name: string
  Title: string
  Domain: string
  BreachDate: string
  DataClasses: string[]
}

export interface BreachLookup {
  breaches: Breach[]
  demo: boolean
}

/** Brechas públicas conocidas, usadas solo en modo demo (sin HIBP_API_KEY y fuera de producción). */
const DEMO_BREACHES: Breach[] = [
  { name: 'Adobe', title: 'Adobe', domain: 'adobe.com', breachDate: '2013-10-04', dataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames'] },
  { name: 'LinkedIn', title: 'LinkedIn', domain: 'linkedin.com', breachDate: '2012-05-05', dataClasses: ['Email addresses', 'Passwords'] },
  { name: 'Dropbox', title: 'Dropbox', domain: 'dropbox.com', breachDate: '2012-07-01', dataClasses: ['Email addresses', 'Passwords'] },
  { name: 'Canva', title: 'Canva', domain: 'canva.com', breachDate: '2019-05-24', dataClasses: ['Email addresses', 'Geographic locations', 'Names', 'Passwords', 'Usernames'] },
  { name: 'MyFitnessPal', title: 'MyFitnessPal', domain: 'myfitnesspal.com', breachDate: '2018-02-01', dataClasses: ['Email addresses', 'IP addresses', 'Passwords', 'Usernames'] },
  { name: 'Wattpad', title: 'Wattpad', domain: 'wattpad.com', breachDate: '2020-06-29', dataClasses: ['Bios', 'Dates of birth', 'Email addresses', 'Genders', 'Names', 'Passwords'] },
  { name: 'Deezer', title: 'Deezer', domain: 'deezer.com', breachDate: '2019-04-22', dataClasses: ['Dates of birth', 'Email addresses', 'Genders', 'Geographic locations', 'Names'] },
  { name: 'Tumblr', title: 'Tumblr', domain: 'tumblr.com', breachDate: '2013-02-28', dataClasses: ['Email addresses', 'Passwords'] },
  { name: 'LastFM', title: 'Last.fm', domain: 'last.fm', breachDate: '2012-03-22', dataClasses: ['Email addresses', 'Passwords', 'Usernames'] },
]

@Injectable()
export class HibpClient {
  private readonly logger = new Logger(HibpClient.name)
  private readonly apiKey: string | undefined
  private readonly demoAllowed: boolean

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('HIBP_API_KEY')
    this.demoAllowed = config.get('NODE_ENV') !== 'production'
  }

  get available(): boolean {
    return Boolean(this.apiKey) || this.demoAllowed
  }

  async lookup(email: string): Promise<BreachLookup> {
    if (!this.apiKey) {
      if (!this.demoAllowed) throw new Error('HIBP_API_KEY no configurada')
      return { breaches: demoBreaches(email), demo: true }
    }

    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`
    const res = await fetch(url, {
      headers: { 'hibp-api-key': this.apiKey, 'user-agent': 'borrar-mi-vida-digital' },
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 404) return { breaches: [], demo: false }
    if (!res.ok) {
      this.logger.warn(`HIBP respondió ${res.status}`)
      throw new Error(`HIBP respondió ${res.status}`)
    }
    const data = (await res.json()) as HibpBreach[]
    return {
      demo: false,
      breaches: data.map((b) => ({
        name: b.Name,
        title: b.Title,
        domain: b.Domain,
        breachDate: b.BreachDate,
        dataClasses: b.DataClasses,
      })),
    }
  }
}

/** Determinista por correo, para que el demo sea estable entre escaneos. */
export function demoBreaches(email: string): Breach[] {
  const digest = createHash('sha256').update(email).digest()
  return DEMO_BREACHES.filter((_, i) => (digest[i] ?? 0) % 3 === 0)
}
