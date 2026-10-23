import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job } from 'bullmq'
import { createTransport, type Transporter } from 'nodemailer'
import { MAIL_QUEUE, type VerificationCodeJob } from './mail.service'

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name)
  private readonly transport: Transporter | null
  private readonly from: string

  constructor(config: ConfigService) {
    super()
    const smtp = config.get<string>('SMTP_URL')
    this.transport = smtp ? createTransport(smtp) : null
    this.from = config.getOrThrow<string>('MAIL_FROM')
  }

  async process(job: Job<VerificationCodeJob>): Promise<void> {
    const { email, code } = job.data
    if (!this.transport) {
      // Sin SMTP (desarrollo) el código se ve en la consola de la API.
      this.logger.log(`Código de verificación para ${email}: ${code}`)
      return
    }
    await this.transport.sendMail({
      from: this.from,
      to: email,
      subject: `Tu código: ${code}`,
      text: [
        `Tu código para Borrar mi vida digital es ${code}.`,
        '',
        'Vence en 10 minutos. Si no lo pediste, ignorá este correo: nadie puede buscar cuentas con tu dirección sin este código.',
      ].join('\n'),
    })
  }
}
