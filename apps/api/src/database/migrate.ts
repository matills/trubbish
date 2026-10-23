import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as path from 'path'

async function main() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL is not set')
  const pool = new Pool({ connectionString: url })
  await migrate(drizzle(pool), { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
  await pool.end()
  console.log('Migraciones aplicadas')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
