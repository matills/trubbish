import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { asc } from 'drizzle-orm'
import type { CatalogEntry, Category } from '@trubbish/shared'
import { DRIZZLE, type Database } from '../../database/database.module'
import { catalogServices } from '../../database/schema'

type CatalogRow = CatalogEntry & { aliases: string[] }

const columns = {
  id: catalogServices.id,
  slug: catalogServices.slug,
  name: catalogServices.name,
  domain: catalogServices.domain,
  aliases: catalogServices.aliases,
  category: catalogServices.category,
  difficulty: catalogServices.difficulty,
  deleteUrl: catalogServices.deleteUrl,
  recoveryUrl: catalogServices.recoveryUrl,
  privacyEmail: catalogServices.privacyEmail,
  steps: catalogServices.steps,
}

const CACHE_MS = 5 * 60_000

/**
 * El catálogo es chico (cientos de filas) y casi estático: se mantiene en
 * memoria y se refresca cada pocos minutos para no consultar la DB por dominio.
 */
@Injectable()
export class CatalogService {
  private cache: { rows: CatalogRow[]; at: number } | null = null

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async all(): Promise<CatalogRow[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.rows
    const rows = await this.db.select(columns).from(catalogServices).orderBy(asc(catalogServices.name))
    this.cache = { rows, at: Date.now() }
    return rows
  }

  async list(query?: string, category?: Category): Promise<CatalogEntry[]> {
    const q = query?.trim().toLowerCase()
    const rows = await this.all()
    return rows
      .filter((r) => !category || r.category === category)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.domain.includes(q) || r.aliases.some((a) => a.includes(q)))
      .map(toEntry)
  }

  async findById(id: number): Promise<CatalogEntry> {
    const row = (await this.all()).find((r) => r.id === id)
    if (!row) throw new NotFoundException('Servicio inexistente')
    return toEntry(row)
  }

  async findManyByIds(ids: number[]): Promise<Map<number, CatalogEntry>> {
    const wanted = new Set(ids)
    return new Map((await this.all()).filter((r) => wanted.has(r.id)).map((r) => [r.id, toEntry(r)]))
  }

  /** Busca el servicio por dominio exacto, alias o subdominio (ej. help.netflix.com). */
  async matchDomain(domain: string): Promise<CatalogEntry | null> {
    const rows = await this.all()
    const hit = rows.find((r) => [r.domain, ...r.aliases].some((d) => domain === d || domain.endsWith(`.${d}`)))
    return hit ? toEntry(hit) : null
  }
}

function toEntry({ aliases: _aliases, ...entry }: CatalogRow): CatalogEntry {
  return entry
}
