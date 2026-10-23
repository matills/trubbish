import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { CryptoService } from './crypto.service'

export const REDIS = Symbol('REDIS')

@Global()
@Module({
  providers: [
    CryptoService,
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: 3 }),
    },
  ],
  exports: [CryptoService, REDIS],
})
export class CommonModule {}
