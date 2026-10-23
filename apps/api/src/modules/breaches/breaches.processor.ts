import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type Database } from '../../database/database.module'
import { breachScans, users } from '../../database/schema'
import { BREACHES_QUEUE, BreachesService, type BreachLookupJob } from './breaches.service'
import { HibpClient } from './hibp.client'

// HIBP limita las consultas por minuto según el plan: una cada 6 s es seguro para el más chico.
@Processor(BREACHES_QUEUE, { limiter: { max: 1, duration: 6_000 } })
export class BreachesProcessor extends WorkerHost {
  private readonly logger = new Logger(BreachesProcessor.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly breaches: BreachesService,
    private readonly hibp: HibpClient,
  ) {
    super()
  }

  async process(job: Job<BreachLookupJob>): Promise<void> {
    const { scanId } = job.data
    const [row] = await this.db
      .select({ email: users.email })
      .from(breachScans)
      .innerJoin(users, eq(users.id, breachScans.userId))
      .where(eq(breachScans.id, scanId))
    if (!row) return // el usuario borró sus datos mientras el job esperaba

    await this.breaches.markRunning(scanId)
    const { breaches, demo } = await this.hibp.lookup(row.email)
    await this.breaches.complete(scanId, breaches, demo)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<BreachLookupJob> | undefined, error: Error): Promise<void> {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return
    this.logger.warn(`Escaneo ${job.data.scanId} falló: ${error.message}`)
    await this.breaches.fail(job.data.scanId)
  }
}
