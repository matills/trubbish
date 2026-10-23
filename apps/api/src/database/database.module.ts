import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export const DRIZZLE = Symbol('DRIZZLE')
export type Database = NodePgDatabase<typeof schema>

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const pool = new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
          statement_timeout: 15_000,
        })
        return drizzle(pool, { schema })
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
