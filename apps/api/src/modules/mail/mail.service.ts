import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'

export const MAIL_QUEUE = 'mail'

export interface VerificationCodeJob {
  email: string
  code: string
}

@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<VerificationCodeJob>) {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
    // El código vive en Redis solo hasta que se manda: el job se borra al completarse.
    await this.queue.add('verification-code', { email, code }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: true,
      removeOnFail: true,
    })
  }
}
