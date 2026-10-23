import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import { Pool } from 'pg'
import { catalogServices } from './schema'
import { CATALOG } from './catalog-data'

// Idempotente: el catálogo es dato de referencia y se actualiza por slug.
async function main() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL is not set')
  const pool = new Pool({ connectionString: url })
  const db = drizzle(pool)
  await db
    .insert(catalogServices)
    .values(CATALOG)
    .onConflictDoUpdate({
      target: catalogServices.slug,
      set: {
        name: sql`excluded.name`,
        domain: sql`excluded.domain`,
        aliases: sql`excluded.aliases`,
        category: sql`excluded.category`,
        difficulty: sql`excluded.difficulty`,
        deleteUrl: sql`excluded.delete_url`,
        recoveryUrl: sql`excluded.recovery_url`,
        privacyEmail: sql`excluded.privacy_email`,
        steps: sql`excluded.steps`,
      },
    })
  await pool.end()
  console.log(`Catálogo: ${CATALOG.length} servicios`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
