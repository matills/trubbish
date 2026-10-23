import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, count, eq } from 'drizzle-orm'
import {
  AccountStatus,
  SENSITIVE_CATEGORIES,
  type AccountSource,
  type AccountStats,
  type BulkImportResult,
  type CatalogEntry,
  type TrackedAccount,
} from '@trubbish/shared'
import { CryptoService } from '../../common/crypto.service'
import { nameFromDomain, normalizeDomain } from '../../common/domain'
import { DRIZZLE, type Database } from '../../database/database.module'
import { trackedAccounts } from '../../database/schema'
import { CatalogService } from '../catalog/catalog.service'
import type { BulkImportDto, CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto'

/** Lo que se guarda cifrado por cuenta. */
interface AccountPayload {
  name: string
  domain: string
  serviceId: number | null
  notes: string | null
}

const columns = {
  id: trackedAccounts.id,
  payload: trackedAccounts.payload,
  status: trackedAccounts.status,
  source: trackedAccounts.source,
  createdAt: trackedAccounts.createdAt,
  updatedAt: trackedAccounts.updatedAt,
  closedAt: trackedAccounts.closedAt,
}

type AccountRow = {
  id: number
  payload: string
  status: AccountStatus
  source: AccountSource
  createdAt: Date
  updatedAt: Date
  closedAt: Date | null
}

const STATUS_ORDER: Record<AccountStatus, number> = { TO_REVIEW: 0, IN_PROGRESS: 1, KEEP: 2, DELETED: 3 }

@Injectable()
export class AccountsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly crypto: CryptoService,
    private readonly catalog: CatalogService,
  ) {}

  async list(userId: number, status?: AccountStatus): Promise<TrackedAccount[]> {
    const rows = await this.db
      .select(columns)
      .from(trackedAccounts)
      .where(status ? and(eq(trackedAccounts.userId, userId), eq(trackedAccounts.status, status)) : eq(trackedAccounts.userId, userId))
    const accounts = await this.hydrate(rows)
    return accounts.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name, 'es'))
  }

  async findOne(userId: number, id: number): Promise<TrackedAccount> {
    const [account] = await this.hydrate([await this.findRow(userId, id)])
    if (!account) throw new NotFoundException('Cuenta inexistente')
    return account
  }

  async create(userId: number, dto: CreateAccountDto): Promise<TrackedAccount> {
    const service = dto.serviceId ? await this.catalog.findById(dto.serviceId) : null
    const domain = service?.domain ?? normalizeDomain(dto.domain ?? '')
    if (!domain) throw new BadRequestException('El dominio no es válido')
    const matched = service ?? (await this.catalog.matchDomain(domain))

    const payload: AccountPayload = {
      name: dto.name?.trim() || matched?.name || nameFromDomain(domain),
      domain: matched?.domain ?? domain,
      serviceId: matched?.id ?? null,
      notes: dto.notes?.trim() || null,
    }
    const [row] = await this.db
      .insert(trackedAccounts)
      .values({
        userId,
        domainHash: this.domainHash(userId, payload.domain),
        payload: this.crypto.encryptJson(payload),
        source: dto.source,
      })
      .onConflictDoNothing()
      .returning(columns)
    if (!row) throw new ConflictException(`${payload.name} ya está en tu expediente`)
    const [account] = await this.hydrate([row])
    return account!
  }

  async bulkImport(userId: number, dto: BulkImportDto): Promise<BulkImportResult> {
    const byDomain = new Map<string, AccountPayload>()
    for (const item of dto.items) {
      const domain = normalizeDomain(item.domain)
      if (!domain) continue
      const matched = await this.catalog.matchDomain(domain)
      const key = matched?.domain ?? domain
      if (byDomain.has(key)) continue
      byDomain.set(key, {
        name: matched?.name ?? (item.name?.trim() || nameFromDomain(key)),
        domain: key,
        serviceId: matched?.id ?? null,
        notes: null,
      })
    }
    if (byDomain.size === 0) return { created: 0, skipped: dto.items.length }

    const inserted = await this.db
      .insert(trackedAccounts)
      .values(
        [...byDomain.values()].map((payload) => ({
          userId,
          domainHash: this.domainHash(userId, payload.domain),
          payload: this.crypto.encryptJson(payload),
          source: dto.source,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: trackedAccounts.id })
    return { created: inserted.length, skipped: dto.items.length - inserted.length }
  }

  async update(userId: number, id: number, dto: UpdateAccountDto): Promise<TrackedAccount> {
    const row = await this.findRow(userId, id)
    const payload = this.crypto.decryptJson<AccountPayload>(row.payload)

    if (dto.status === AccountStatus.DELETED && row.status !== AccountStatus.DELETED && !dto.confirmSensitive) {
      const service = payload.serviceId ? await this.catalog.findById(payload.serviceId) : null
      if (service && SENSITIVE_CATEGORIES.includes(service.category)) {
        throw new BadRequestException({
          message: `${payload.name} es una cuenta sensible. Confirmá que ya no la necesitás.`,
          code: 'SENSITIVE_CONFIRMATION_REQUIRED',
        })
      }
    }

    const nextPayload = dto.notes !== undefined ? { ...payload, notes: dto.notes?.trim() || null } : payload
    const nextStatus = dto.status ?? row.status
    const closedAt =
      nextStatus === AccountStatus.DELETED ? (row.status === AccountStatus.DELETED ? row.closedAt : new Date()) : null

    const [updated] = await this.db
      .update(trackedAccounts)
      .set({ status: nextStatus, payload: this.crypto.encryptJson(nextPayload), closedAt, updatedAt: new Date() })
      .where(and(eq(trackedAccounts.id, id), eq(trackedAccounts.userId, userId)))
      .returning(columns)
    const [account] = await this.hydrate([updated!])
    return account!
  }

  async remove(userId: number, id: number): Promise<void> {
    const deleted = await this.db
      .delete(trackedAccounts)
      .where(and(eq(trackedAccounts.id, id), eq(trackedAccounts.userId, userId)))
      .returning({ id: trackedAccounts.id })
    if (deleted.length === 0) throw new NotFoundException('Cuenta inexistente')
  }

  async stats(userId: number): Promise<AccountStats> {
    const rows = await this.db
      .select({ status: trackedAccounts.status, n: count() })
      .from(trackedAccounts)
      .where(eq(trackedAccounts.userId, userId))
      .groupBy(trackedAccounts.status)
    const byStatus: Record<AccountStatus, number> = { TO_REVIEW: 0, KEEP: 0, IN_PROGRESS: 0, DELETED: 0 }
    for (const r of rows) byStatus[r.status] = r.n
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
    // Las que el usuario decide conservar no cuentan para la tasa de cierre.
    const closable = total - byStatus.KEEP
    return { total, byStatus, closeRate: closable === 0 ? 0 : byStatus.DELETED / closable }
  }

  private async findRow(userId: number, id: number): Promise<AccountRow> {
    const [row] = await this.db
      .select(columns)
      .from(trackedAccounts)
      .where(and(eq(trackedAccounts.id, id), eq(trackedAccounts.userId, userId)))
    if (!row) throw new NotFoundException('Cuenta inexistente')
    return row
  }

  private domainHash(userId: number, domain: string): string {
    return this.crypto.hmac(`${userId}:${domain}`)
  }

  private async hydrate(rows: AccountRow[]): Promise<TrackedAccount[]> {
    const decoded = rows.map((row) => ({ row, payload: this.crypto.decryptJson<AccountPayload>(row.payload) }))
    const ids = decoded.map((d) => d.payload.serviceId).filter((id): id is number => id !== null)
    const services: Map<number, CatalogEntry> = ids.length ? await this.catalog.findManyByIds(ids) : new Map()
    return decoded.map(({ row, payload }) => ({
      id: row.id,
      name: payload.name,
      domain: payload.domain,
      notes: payload.notes,
      status: row.status,
      source: row.source,
      service: payload.serviceId ? (services.get(payload.serviceId) ?? null) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
    }))
  }
}
