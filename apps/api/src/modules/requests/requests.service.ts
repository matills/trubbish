import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import { AccountStatus, RequestStatus, type DeletionRequest, type Law } from '@borrar/shared'
import type { SessionUser } from '../../common/auth'
import { CryptoService } from '../../common/crypto.service'
import { DRIZZLE, type Database } from '../../database/database.module'
import { deletionRequests } from '../../database/schema'
import { AccountsService } from '../accounts/accounts.service'
import type { CreateRequestDto } from './dto/requests.dto'
import { buildLetter, dueDate } from './letters'

interface RequestPayload {
  recipient: string | null
  subject: string
  body: string
}

const columns = {
  id: deletionRequests.id,
  accountId: deletionRequests.accountId,
  law: deletionRequests.law,
  status: deletionRequests.status,
  payload: deletionRequests.payload,
  sentAt: deletionRequests.sentAt,
  dueAt: deletionRequests.dueAt,
  createdAt: deletionRequests.createdAt,
}

type RequestRow = {
  id: number
  accountId: number
  law: Law
  status: RequestStatus
  payload: string
  sentAt: Date | null
  dueAt: Date | null
  createdAt: Date
}

@Injectable()
export class RequestsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly crypto: CryptoService,
    private readonly accounts: AccountsService,
  ) {}

  async list(userId: number, accountId?: number): Promise<DeletionRequest[]> {
    const where = accountId
      ? and(eq(deletionRequests.userId, userId), eq(deletionRequests.accountId, accountId))
      : eq(deletionRequests.userId, userId)
    const rows = await this.db.select(columns).from(deletionRequests).where(where).orderBy(desc(deletionRequests.createdAt))
    return rows.map((r) => this.toRequest(r))
  }

  async create(user: SessionUser, dto: CreateRequestDto): Promise<DeletionRequest> {
    // findOne verifica que la cuenta sea del usuario.
    const account = await this.accounts.findOne(user.id, dto.accountId)
    const letter = buildLetter({
      law: dto.law,
      fullName: dto.fullName.trim(),
      documentId: dto.documentId?.replace(/\./g, ''),
      email: user.email,
      serviceName: account.name,
      serviceDomain: account.domain,
      date: new Date(),
    })
    const payload: RequestPayload = {
      recipient: dto.recipient ?? account.service?.privacyEmail ?? null,
      ...letter,
    }
    const [row] = await this.db
      .insert(deletionRequests)
      .values({ userId: user.id, accountId: account.id, law: dto.law, payload: this.crypto.encryptJson(payload) })
      .returning(columns)
    return this.toRequest(row!)
  }

  async updateStatus(userId: number, id: number, status: RequestStatus): Promise<DeletionRequest> {
    const [current] = await this.db
      .select(columns)
      .from(deletionRequests)
      .where(and(eq(deletionRequests.id, id), eq(deletionRequests.userId, userId)))
    if (!current) throw new NotFoundException('Pedido inexistente')

    // Al marcarlo enviado empieza a correr el plazo legal.
    const sentAt = status === RequestStatus.SENT && !current.sentAt ? new Date() : current.sentAt
    const dueAt = sentAt ? dueDate(current.law, sentAt) : null
    const [row] = await this.db
      .update(deletionRequests)
      .set({ status, sentAt, dueAt })
      .where(and(eq(deletionRequests.id, id), eq(deletionRequests.userId, userId)))
      .returning(columns)

    if (status === RequestStatus.SENT) {
      const account = await this.accounts.findOne(userId, current.accountId)
      if (account.status === AccountStatus.TO_REVIEW) {
        await this.accounts.update(userId, account.id, { status: AccountStatus.IN_PROGRESS })
      }
    }
    return this.toRequest(row!)
  }

  async remove(userId: number, id: number): Promise<void> {
    const deleted = await this.db
      .delete(deletionRequests)
      .where(and(eq(deletionRequests.id, id), eq(deletionRequests.userId, userId)))
      .returning({ id: deletionRequests.id })
    if (deleted.length === 0) throw new NotFoundException('Pedido inexistente')
  }

  private toRequest(row: RequestRow): DeletionRequest {
    const payload = this.crypto.decryptJson<RequestPayload>(row.payload)
    return {
      id: row.id,
      accountId: row.accountId,
      law: row.law,
      status: row.status,
      recipient: payload.recipient,
      subject: payload.subject,
      body: payload.body,
      sentAt: row.sentAt?.toISOString() ?? null,
      dueAt: row.dueAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
