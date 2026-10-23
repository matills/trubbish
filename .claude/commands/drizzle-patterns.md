---
name: drizzle-patterns
description: Drizzle ORM patterns for NestJS + PostgreSQL — schema design, relational queries, transactions, migrations, and common traps like missing column selection, transaction scope, and migration workflow.
---

# Patrones de Drizzle

Patrones de producción para Drizzle ORM con NestJS y PostgreSQL (drizzle-orm + drizzle-kit).

## Cuándo activarlo

- Al diseñar o modificar el esquema de Drizzle
- Al escribir queries, transacciones, o lógica de paginación
- Al correr o planificar migraciones de base de datos
- Al implementar soft delete o queries filtradas
- Al debuggear comportamiento específico de Drizzle

## Setup del proyecto (NestJS)

### DrizzleService

```ts
// src/database/drizzle.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

@Injectable()
export class DrizzleService implements OnModuleInit {
  private pool: Pool
  db: NodePgDatabase<typeof schema>

  onModuleInit() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL })
    this.db = drizzle(this.pool, { schema })
  }

  async onModuleDestroy() {
    await this.pool.end()
  }
}
```

### Inyectar en un servicio

```ts
@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return this.drizzle.db
  }
}
```

## Diseño de esquema

### Convención de nombres

Drizzle usa camelCase en TS, snake_case en el nombre de la columna de DB:

```ts
import { pgTable, bigserial, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})
```

### IDs

- Usar `bigserial` para primary keys internas (coincide con la decisión de `bigserial` del doc de arquitectura).
- Exponer slugs o UUIDs en URLs públicas — nunca IDs secuenciales crudos.

### Relations

Declarar las relations por separado de la definición de la tabla:

```ts
import { relations } from 'drizzle-orm'

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  accounts: many(trackedAccounts),
}))
```

## Queries

### API relacional (preferida para la mayoría de las queries)

```ts
// Seleccionar columnas específicas — nunca omitir columnas en tablas sensibles
const user = await this.db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, id),
  columns: { id: true, email: true },
  with: {
    profile: { columns: { username: true, avatarUrl: true } },
  },
})
```

### API estilo SQL (para queries complejas, agregados, joins)

```ts
import { eq, and, isNull, desc } from 'drizzle-orm'

const [user] = await this.db
  .select({ id: users.id, email: users.email })
  .from(users)
  .where(and(eq(users.id, id), isNull(users.deletedAt)))
  .limit(1)
```

### Nunca devolver filas completas de tablas sensibles

```ts
// ❌ Incorrecto — filtra passwordHash
const user = await this.db.query.users.findFirst({
  where: (u, { eq }) => eq(u.id, id),
})

// ✅ Correcto
const user = await this.db.query.users.findFirst({
  where: (u, { eq }) => eq(u.id, id),
  columns: { id: true, email: true },
})
```

## Transacciones

```ts
await this.db.transaction(async (tx) => {
  const [list] = await tx.insert(schema.lists).values(listData).returning()
  await tx.insert(schema.listCollaborators).values({
    listId: list.id,
    userId: ownerId,
    role: 'owner',
  })
})
```

Mantener las transacciones cortas — sin llamadas HTTP externas ni dispatches de BullMQ dentro de una transacción.

## Paginación

### Por cursor (feeds, datasets grandes)

```ts
async function getReviews(cursor?: number, limit = 20) {
  const rows = await db
    .select()
    .from(reviews)
    .where(cursor ? lt(reviews.id, cursor) : undefined)
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(limit + 1)

  const hasNextPage = rows.length > limit
  if (hasNextPage) rows.pop()
  return { items: rows, nextCursor: hasNextPage ? rows[rows.length - 1].id : null }
}
```

### Por offset (tablas de admin, páginas fijas)

```ts
const rows = await db.select().from(users).limit(20).offset(page * 20)
```

## Soft Delete

Siempre filtrar `deletedAt IS NULL` explícitamente — Drizzle no tiene middleware global para esto:

```ts
// Todas las queries en tablas con soft-delete deben incluir este filtro
.where(and(eq(users.id, id), isNull(users.deletedAt)))
```

## Migraciones (drizzle-kit)

```bash
# Generar migración a partir de cambios en el esquema
pnpm drizzle-kit generate

# Aplicar migraciones (dev local)
pnpm drizzle-kit migrate

# Aplicar migraciones (CI/CD, staging, producción)
# Usar un script de migración que llame a drizzle-kit migrate programáticamente
# o drizzle-kit push para entornos de deploy
```

Nunca editar un archivo de migración después de que se aplicó. Crear una migración nueva en su lugar.

## Trampas comunes

### Se necesita `returning()` para obtener las filas insertadas/actualizadas

```ts
// ❌ Incorrecto — el resultado es void
await this.db.insert(lists).values(data)

// ✅ Correcto
const [list] = await this.db.insert(lists).values(data).returning()
```

### `update()` sin `where` actualiza todas las filas

```ts
// ❌ Incorrecto — actualiza todos los usuarios
await this.db.update(users).set({ isActive: false })

// ✅ Correcto
await this.db.update(users).set({ isActive: false }).where(eq(users.id, id))
```

### La API relacional requiere que se pase `schema` a `drizzle()`

Si `db.query.users` lanza "table not found", el objeto schema no se pasó a `drizzle(pool, { schema })`.

## Skills relacionados

- `nestjs-patterns` — capa de servicio de NestJS
- `postgres-patterns` — indexación a nivel de PostgreSQL y tuning de queries
- `database-migrations` — planificación de migraciones multi-paso para producción
