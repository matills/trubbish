---
name: postgres-patterns
description: PostgreSQL database patterns for query optimization, schema design, indexing, and security. Based on Supabase best practices.
origin: ECC
---

# Patrones de PostgreSQL

Referencia rápida de best practices de PostgreSQL. Para guía detallada, usar el agente `database-reviewer`.

## Cuándo activarlo

- Al escribir queries SQL o migraciones
- Al diseñar esquemas de base de datos
- Al resolver queries lentas
- Al implementar Row Level Security
- Al configurar connection pooling

## Referencia rápida

### Cheat Sheet de índices

| Patrón de query | Tipo de índice | Ejemplo |
|--------------|------------|---------|
| `WHERE col = value` | B-tree (default) | `CREATE INDEX idx ON t (col)` |
| `WHERE col > value` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | Compuesto | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| `WHERE tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| Rangos de series temporales | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

### Referencia rápida de tipos de datos

| Caso de uso | Tipo correcto | Evitar |
|----------|-------------|-------|
| IDs | `bigint` | `int`, UUID random |
| Strings | `text` | `varchar(255)` |
| Timestamps | `timestamptz` | `timestamp` |
| Dinero | `numeric(10,2)` | `float` |
| Flags | `boolean` | `varchar`, `int` |

### Patrones comunes

**Orden de índice compuesto:**
```sql
-- Columnas de igualdad primero, después las de rango
CREATE INDEX idx ON orders (status, created_at);
-- Funciona para: WHERE status = 'pending' AND created_at > '2024-01-01'
```

**Índice covering:**
```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
-- Evita el table lookup para SELECT email, name, created_at
```

**Índice parcial:**
```sql
CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;
-- Índice más chico, solo incluye usuarios activos
```

**Política RLS (optimizada):**
```sql
CREATE POLICY policy ON orders
  USING ((SELECT auth.uid()) = user_id);  -- ¡Envolver en SELECT!
```

**UPSERT:**
```sql
INSERT INTO settings (user_id, key, value)
VALUES (123, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
```

**Paginación por cursor:**
```sql
SELECT * FROM products WHERE id > $last_id ORDER BY id LIMIT 20;
-- O(1) vs OFFSET que es O(n)
```

**Procesamiento de queue:**
```sql
UPDATE jobs SET status = 'processing'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
) RETURNING *;
```

### Detección de anti-patrones

```sql
-- Encontrar foreign keys sin índice
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );

-- Encontrar queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Chequear bloat de tablas
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Template de configuración

```sql
-- Límites de conexión (ajustar según la RAM)
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET work_mem = '8MB';

-- Timeouts
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
ALTER SYSTEM SET statement_timeout = '30s';

-- Monitoreo
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Defaults de seguridad
REVOKE ALL ON SCHEMA public FROM public;

SELECT pg_reload_conf();
```

## Relacionados

- Agente: `database-reviewer` - Flujo completo de review de base de datos
- Skill: `clickhouse-io` - Patrones de analytics de ClickHouse
- Skill: `backend-patterns` - Patrones de API y backend

---

*Basado en Supabase Agent Skills (crédito: equipo de Supabase) (licencia MIT)*
