import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { desc, eq } from 'drizzle-orm'
import { ScanStatus, type Breach, type BreachScan } from '@borrar/shared'
import { CryptoService } from '../../common/crypto.service'
import { DRIZZLE, type Database } from '../../database/database.module'
import { breachScans } from '../../database/schema'
import { HibpClient } from './hibp.client'

export const BREACHES_QUEUE = 'breaches'
export interface BreachLookupJob {
  scanId: number
}

/** Un escaneo cada 10 minutos por usuario: HIBP cobra y limita por clave. */
const RESCAN_COOLDOWN_MS = 10 * 60_000

const columns = {
  id: breachScans.id,
  status: breachScans.status,
  demo: breachScans.demo,
  payload: breachScans.payload,
  createdAt: breachScans.createdAt,
  finishedAt: breachScans.finishedAt,
}

@Injectable()
export class BreachesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @InjectQueue(BREACHES_QUEUE) private readonly queue: Queue<BreachLookupJob>,
    private readonly crypto: CryptoService,
    private readonly hibp: HibpClient,
  ) {}

  async latest(userId: number): Promise<BreachScan | null> {
    const [row] = await this.db
      .select(columns)
      .from(breachScans)
      .where(eq(breachScans.userId, userId))
      .orderBy(desc(breachScans.createdAt))
      .limit(1)
    return row ? this.toScan(row) : null
  }

  async startScan(userId: number): Promise<BreachScan> {
    if (!this.hibp.available) throw new ServiceUnavailableException('La consulta de filtraciones no está configurada')

    const last = await this.latest(userId)
    if (last) {
      const inFlight = last.status === ScanStatus.QUEUED || last.status === ScanStatus.RUNNING
      const fresh = last.status === ScanStatus.DONE && Date.now() - new Date(last.createdAt).getTime() < RESCAN_COOLDOWN_MS
      if (inFlight || fresh) return last
    }

    const [row] = await this.db.insert(breachScans).values({ userId }).returning(columns)
    await this.queue.add('lookup', { scanId: row!.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    })
    return this.toScan(row!)
  }

  async markRunning(scanId: number): Promise<void> {
    await this.db.update(breachScans).set({ status: ScanStatus.RUNNING }).where(eq(breachScans.id, scanId))
  }

  async complete(scanId: number, breaches: Breach[], demo: boolean): Promise<void> {
    await this.db
      .update(breachScans)
      .set({ status: ScanStatus.DONE, demo, payload: this.crypto.encryptJson(breaches), finishedAt: new Date() })
      .where(eq(breachScans.id, scanId))
  }

  async fail(scanId: number): Promise<void> {
    await this.db
      .update(breachScans)
      .set({ status: ScanStatus.FAILED, finishedAt: new Date() })
      .where(eq(breachScans.id, scanId))
  }

  private toScan(row: {
    id: number
    status: ScanStatus
    demo: boolean
    payload: string | null
    createdAt: Date
    finishedAt: Date | null
  }): BreachScan {
    return {
      id: row.id,
      status: row.status,
      demo: row.demo,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      breaches: row.payload ? this.crypto.decryptJson<Breach[]>(row.payload) : [],
    }
  }
}
