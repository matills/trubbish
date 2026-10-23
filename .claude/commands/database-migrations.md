---
name: database-migrations
description: Database migration best practices for schema changes, data migrations, rollbacks, and zero-downtime deployments across PostgreSQL, MySQL, and common ORMs (Prisma, Drizzle, Kysely, Django, TypeORM, golang-migrate).
origin: ECC
---

# Patrones de migración de base de datos

Cambios de esquema de base de datos seguros y reversibles para sistemas de producción.

## Cuándo activarlo

- Al crear o alterar tablas de base de datos
- Al agregar/quitar columnas o índices
- Al correr migraciones de datos (backfill, transform)
- Al planificar cambios de esquema zero-downtime
- Al configurar tooling de migraciones para un proyecto nuevo

## Principios core

1. **Cada cambio es una migración** — nunca alterar bases de datos de producción manualmente
2. **Las migraciones son forward-only en producción** — los rollbacks usan migraciones forward nuevas
3. **Las migraciones de esquema y de datos son separadas** — nunca mezclar DDL y DML en una migración
4. **Testear las migraciones contra datos del tamaño de producción** — una migración que funciona con 100 filas puede lockear con 10M
5. **Las migraciones son inmutables una vez deployadas** — nunca editar una migración que ya corrió en producción

## Checklist de seguridad de migraciones

Antes de aplicar cualquier migración:

- [ ] La migración tiene UP y DOWN (o está explícitamente marcada como irreversible)
- [ ] Sin locks de tabla completa en tablas grandes (usar operaciones concurrentes)
- [ ] Las columnas nuevas tienen defaults o son nullable (nunca agregar NOT NULL sin default)
- [ ] Los índices se crean de forma concurrente (no inline con CREATE TABLE para tablas existentes)
- [ ] El backfill de datos es una migración separada del cambio de esquema
- [ ] Se testeó contra una copia de los datos de producción
- [ ] El plan de rollback está documentado

## Patrones de PostgreSQL

### Agregar una columna de forma segura

```sql
-- BIEN: Columna nullable, sin lock
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- BIEN: Columna con default (Postgres 11+ es instantáneo, sin rewrite)
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- MAL: NOT NULL sin default en una tabla existente (requiere rewrite completo)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
-- Esto lockea la tabla y reescribe cada fila
```

### Agregar un índice sin downtime

```sql
-- MAL: Bloquea escrituras en tablas grandes
CREATE INDEX idx_users_email ON users (email);

-- BIEN: No bloqueante, permite escrituras concurrentes
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- Nota: CONCURRENTLY no puede correr dentro de un bloque de transacción
-- La mayoría de las herramientas de migración necesitan manejo especial para esto
```

### Renombrar una columna (Zero-Downtime)

Nunca renombrar directamente en producción. Usar el patrón expand-contract:

```sql
-- Paso 1: Agregar la columna nueva (migración 001)
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Paso 2: Backfill de datos (migración 002, migración de datos)
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Paso 3: Actualizar el código de la app para leer/escribir ambas columnas
-- Deployar los cambios de la app

-- Paso 4: Dejar de escribir a la columna vieja, eliminarla (migración 003)
ALTER TABLE users DROP COLUMN username;
```

### Eliminar una columna de forma segura

```sql
-- Paso 1: Eliminar todas las referencias de la app a la columna
-- Paso 2: Deployar la app sin la referencia a la columna
-- Paso 3: Eliminar la columna en la siguiente migración
ALTER TABLE orders DROP COLUMN legacy_status;

-- Para Django: usar SeparateDatabaseAndState para eliminar del modelo
-- sin generar DROP COLUMN (después eliminarla en la siguiente migración)
```

### Migraciones de datos grandes

```sql
-- MAL: Actualiza todas las filas en una sola transacción (lockea la tabla)
UPDATE users SET normalized_email = LOWER(email);

-- BIEN: Update en batch con progreso
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users
      WHERE normalized_email IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', rows_updated;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

## Prisma (TypeScript/Node.js)

### Flujo de trabajo

```bash
# Crear una migración a partir de cambios de esquema
npx prisma migrate dev --name add_user_avatar

# Aplicar migraciones pendientes en producción
npx prisma migrate deploy

# Resetear la base de datos (solo dev)
npx prisma migrate reset

# Generar el client después de cambios de esquema
npx prisma generate
```

### Ejemplo de esquema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
  @@index([email])
}
```

### Migración SQL custom

Para operaciones que Prisma no puede expresar (índices concurrentes, backfills de datos):

```bash
# Crear una migración vacía, después editar el SQL manualmente
npx prisma migrate dev --create-only --name add_email_index
```

```sql
-- migrations/20240115_add_email_index/migration.sql
-- Prisma no puede generar CONCURRENTLY, así que lo escribimos manualmente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

## Drizzle (TypeScript/Node.js)

### Flujo de trabajo

```bash
# Generar migración a partir de cambios de esquema
npx drizzle-kit generate

# Aplicar migraciones
npx drizzle-kit migrate

# Pushear el esquema directamente (solo dev, sin archivo de migración)
npx drizzle-kit push
```

### Ejemplo de esquema

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Kysely (TypeScript/Node.js)

### Flujo de trabajo (kysely-ctl)

```bash
# Inicializar el archivo de config (kysely.config.ts)
kysely init

# Crear un archivo de migración nuevo
kysely migrate make add_user_avatar

# Aplicar todas las migraciones pendientes
kysely migrate latest

# Rollback de la última migración
kysely migrate down

# Mostrar el status de las migraciones
kysely migrate list
```

### Archivo de migración

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from 'kysely'

// IMPORTANTE: Siempre usar Kysely<any>, no tu interface de DB tipada.
// Las migraciones quedan congeladas en el tiempo y no deben depender de los types actuales del esquema.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()

  await db.schema
    .createIndex('idx_user_profile_avatar')
    .on('user_profile')
    .column('avatar_url')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profile').execute()
}
```

### Migrator programático

```typescript
import { Migrator, FileMigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'
// Solo ESM — CJS puede usar __dirname directamente
import { fileURLToPath } from 'url'
const migrationFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  './migrations',
)

// `db` es tu instancia de base de datos Kysely<any>
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
  // ADVERTENCIA: Habilitar solo en desarrollo. Deshabilita la validación
  // de ordenamiento por timestamp, lo que puede causar drift de esquema
  // entre entornos.
  // allowUnorderedMigrations: true,
})

const { error, results } = await migrator.migrateToLatest()

results?.forEach((it) => {
  if (it.status === 'Success') {
    console.log(`migration "${it.migrationName}" executed successfully`)
  } else if (it.status === 'Error') {
    console.error(`failed to execute migration "${it.migrationName}"`)
  }
})

if (error) {
  console.error('migration failed', error)
  process.exit(1)
}
```

## Django (Python)

### Flujo de trabajo

```bash
# Generar migración a partir de cambios de modelo
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Mostrar el status de las migraciones
python manage.py showmigrations

# Generar migración vacía para SQL custom
python manage.py makemigrations --empty app_name -n description
```

### Migración de datos

```python
from django.db import migrations

def backfill_display_names(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch_size = 5000
    users = User.objects.filter(display_name="")
    while users.exists():
        batch = list(users[:batch_size])
        for user in batch:
            user.display_name = user.username
        User.objects.bulk_update(batch, ["display_name"], batch_size=batch_size)

def reverse_backfill(apps, schema_editor):
    pass  # Migración de datos, no necesita reverse

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]

    operations = [
        migrations.RunPython(backfill_display_names, reverse_backfill),
    ]
```

### SeparateDatabaseAndState

Eliminar una columna del modelo de Django sin borrarla de la base de datos de inmediato:

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="user", name="legacy_field"),
            ],
            database_operations=[],  # Todavía no tocar la DB
        ),
    ]
```

## golang-migrate (Go)

### Flujo de trabajo

```bash
# Crear el par de migración
migrate create -ext sql -dir migrations -seq add_user_avatar

# Aplicar todas las migraciones pendientes
migrate -path migrations -database "$DATABASE_URL" up

# Rollback de la última migración
migrate -path migrations -database "$DATABASE_URL" down 1

# Forzar versión (corregir estado dirty)
migrate -path migrations -database "$DATABASE_URL" force VERSION
```

### Archivos de migración

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

## Estrategia de migración Zero-Downtime

Para cambios críticos de producción, seguir el patrón expand-contract:

```
Fase 1: EXPAND
  - Agregar columna/tabla nueva (nullable o con default)
  - Deploy: la app escribe a la VIEJA y a la NUEVA
  - Backfill de los datos existentes

Fase 2: MIGRATE
  - Deploy: la app lee de la NUEVA, escribe a AMBAS
  - Verificar consistencia de datos

Fase 3: CONTRACT
  - Deploy: la app solo usa la NUEVA
  - Eliminar la columna/tabla vieja en una migración separada
```

### Ejemplo de timeline

```
Día 1: La migración agrega la columna new_status (nullable)
Día 1: Deploy de la app v2 — escribe a status y new_status
Día 2: Correr la migración de backfill para las filas existentes
Día 3: Deploy de la app v3 — lee solo de new_status
Día 7: La migración elimina la columna status vieja
```

## Anti-patrones

| Anti-patrón | Por qué falla | Mejor approach |
|-------------|-------------|-----------------|
| SQL manual en producción | Sin audit trail, no repetible | Siempre usar archivos de migración |
| Editar migraciones deployadas | Causa drift entre entornos | Crear una migración nueva en su lugar |
| NOT NULL sin default | Lockea la tabla, reescribe todas las filas | Agregar nullable, backfill, después agregar el constraint |
| Índice inline en tabla grande | Bloquea escrituras durante el build | CREATE INDEX CONCURRENTLY |
| Esquema + datos en una migración | Difícil de hacer rollback, transacciones largas | Migraciones separadas |
| Eliminar columna antes de quitar el código | Errores de aplicación por columna faltante | Quitar el código primero, eliminar la columna en el siguiente deploy |
