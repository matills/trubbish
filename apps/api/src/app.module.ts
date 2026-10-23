import { BullModule } from '@nestjs/bullmq'
import { Controller, Get, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonModule } from './common/common.module'
import { validateEnv } from './config/env'
import { DatabaseModule } from './database/database.module'
import { AccountsModule } from './modules/accounts/accounts.module'
import { AuthModule } from './modules/auth/auth.module'
import { BreachesModule } from './modules/breaches/breaches.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { RequestsModule } from './modules/requests/requests.module'
import { UsersModule } from './modules/users/users.module'

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true }
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('REDIS_URL'))
        return { connection: { host: url.hostname, port: Number(url.port || 6379), password: url.password || undefined } }
      },
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    AccountsModule,
    BreachesModule,
    RequestsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
