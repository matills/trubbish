---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for NestJS + Drizzle + PostgreSQL.
origin: borrar (adapted from ECC's Supabase/Next.js-based skill)
---

# Patrones de desarrollo backend (NestJS + Drizzle)

Patrones de arquitectura backend y best practices para aplicaciones server-side escalables, acordes a las convenciones de [`rules/nestjs.md`](../../rules/nestjs.md) y [`skills/drizzle-patterns`](../drizzle-patterns/SKILL.md).

## Cuándo activarlo

- Al diseñar endpoints de API REST
- Al implementar capas de repository, service, o controller en NestJS
- Al optimizar queries de base de datos (N+1, indexación, connection pooling)
- Al agregar caching (Redis, headers de HTTP cache)
- Al configurar background jobs con BullMQ
- Al estructurar el manejo de errores y validación para APIs
- Al construir guards de auth o interceptors

## Patrones de diseño de API

### Estructura de API RESTful

```typescript
// ✅ URLs basadas en recursos
GET    /api/lists                 # Listar recursos
GET    /api/lists/:id             # Traer un recurso
POST   /api/lists                 # Crear un recurso
PATCH  /api/lists/:id             # Actualizar un recurso
DELETE /api/lists/:id             # Eliminar un recurso

// ✅ Query parameters para filtrado, ordenamiento, paginación
GET /api/catalog/search?category=social&sort=difficulty&limit=20&cursor=120
```

### Repository Pattern (Drizzle)

```typescript
// src/modules/lists/lists.repository.ts
import { Injectable } from '@nestjs/common'
import { eq, isNull, and } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import * as schema from '@/database/schema'

@Injectable()
export class ListsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return this.drizzle.db
  }

  async findById(id: number) {
    return this.db.query.lists.findFirst({
      where: and(eq(schema.lists.id, id), isNull(schema.lists.deletedAt)),
      columns: { id: true, name: true, ownerId: true, createdAt: true },
      with: { collaborators: { columns: { userId: true, role: true } } },
    })
  }

  async create(data: typeof schema.lists.$inferInsert) {
    const [list] = await this.db.insert(schema.lists).values(data).returning()
    return list
  }
}
```

### Service Layer Pattern

```typescript
// src/modules/catalog/catalog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { CatalogRepository } from './catalog.repository'

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepo: CatalogRepository) {}

  async search(query: string, limit = 10) {
    return this.catalogRepo.searchByName(query, limit)
  }

  async findById(id: number) {
    const service = await this.catalogRepo.findById(id)
    if (!service) throw new NotFoundException(`Service with id ${id} not found`)
    return service
  }
}
```

### Guard + Decorator Pattern (auth)

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization?.replace('Bearer ', '')

    if (!token) return false

    request.user = await this.jwtService.verifyAsync(token)
    return true
  }
}
```

```typescript
// ✅ Uso — el guard protege la ruta, @CurrentUser() extrae el usuario
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: JwtPayload) {
  return this.usersService.findById(user.sub)
}
```

## Patrones de base de datos

### Optimización de queries

```typescript
// ✅ BIEN: seleccionar solo las columnas necesarias
const items = await db.query.content.findMany({
  where: eq(schema.content.status, 'ongoing'),
  columns: { id: true, title: true, popularity: true },
  orderBy: desc(schema.content.popularity),
  limit: 10,
})

// ❌ MAL: seleccionar todo, incluyendo columnas sensibles o pesadas
const items = await db.select().from(schema.content)
```

### Prevención de queries N+1

```typescript
// ❌ MAL: problema de query N+1
const lists = await listsRepo.findAll()
for (const list of lists) {
  list.owner = await usersRepo.findById(list.ownerId)  // N queries
}

// ✅ BIEN: fetch en batch con inArray
import { inArray } from 'drizzle-orm'

const lists = await listsRepo.findAll()
const ownerIds = lists.map(l => l.ownerId)
const owners = await db.query.users.findMany({
  where: inArray(schema.users.id, ownerIds),
  columns: { id: true, username: true, avatarUrl: true },
})
const ownerMap = new Map(owners.map(o => [o.id, o]))

lists.forEach(list => {
  list.owner = ownerMap.get(list.ownerId)
})
```

### Transaction Pattern

```typescript
async function createListWithOwner(listData: CreateListDto, ownerId: number) {
  return this.db.transaction(async (tx) => {
    const [list] = await tx.insert(schema.lists).values(listData).returning()

    await tx.insert(schema.listCollaborators).values({
      listId: list.id,
      userId: ownerId,
      role: 'owner',
    })

    return list
  })
}
```

Mantener las transacciones cortas — sin llamadas HTTP externas ni dispatches de BullMQ dentro de una transacción (ver `skills/drizzle-patterns`).

## Estrategias de caching

### Capa de caching con Redis

```typescript
@Injectable()
export class CachedContentRepository {
  constructor(
    private readonly baseRepo: ContentRepository,
    private readonly redis: RedisService,
  ) {}

  async findById(id: number) {
    const cacheKey = `content:${id}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const content = await this.baseRepo.findById(id)

    if (content) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(content))
    }

    return content
  }

  async invalidate(id: number) {
    await this.redis.del(`content:${id}`)
  }
}
```

## Patrones de manejo de errores

### Exception Filter centralizado (NestJS)

NestJS ya maneja esto vía su exception layer — nunca envolver manualmente en el controller. El patrón correcto es un `ExceptionFilter` global, no un try/catch por endpoint:

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error'

    response.status(status).json({ statusCode: status, message })
  }
}
```

```typescript
// ✅ El service lanza, el controller no atrapa — el filtro global se encarga
async findById(id: number) {
  const content = await this.contentRepo.findById(id)
  if (!content) throw new NotFoundException(`Content with id ${id} not found`)
  return content
}
```

### Retry con Exponential Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// Uso — por ejemplo, contra la API de Have I Been Pwned
const data = await fetchWithRetry(() => hibpClient.breachedAccount(email))
```

## Autorización basada en roles

```typescript
type Permission = 'read' | 'write' | 'delete' | 'admin'

interface User {
  id: number
  role: 'admin' | 'moderator' | 'user'
}

const rolePermissions: Record<User['role'], Permission[]> = {
  admin: ['read', 'write', 'delete', 'admin'],
  moderator: ['read', 'write', 'delete'],
  user: ['read', 'write'],
}

export function hasPermission(user: User, permission: Permission): boolean {
  return rolePermissions[user.role].includes(permission)
}
```

```typescript
// ✅ El check de permiso vive en el servicio, no en el guard (regla de nestjs.md:
// los checks de rol que requieren datos de negocio van en la capa de servicio)
async deleteReview(reviewId: number, user: JwtPayload) {
  const review = await this.reviewsRepo.findById(reviewId)
  if (!review) throw new NotFoundException()

  if (review.authorId !== user.sub && !hasPermission(user, 'admin')) {
    throw new ForbiddenException('You do not have permission to delete this review')
  }

  return this.reviewsRepo.softDelete(reviewId)
}
```

## Rate Limiting

El rate limiting debe usar un store compartido como Redis, un gateway, o el
limiter nativo de la plataforma (`@nestjs/throttler` con un storage de Redis en
multi-instancia). No usar contadores in-memory por proceso para APIs de
producción: se resetean en cada deploy, se dividen entre réplicas, y fallan
abiertos (fail open) en entornos multi-instancia.

Mantener la capa de backend responsable de elegir el punto de integración y la
forma del error; usar `api-design` para el contrato HTTP y `security-review`
para la revisión de casos de abuso.

## Background Jobs con BullMQ

Los side effects (envío de códigos, consultas a HIBP, recordatorios) nunca son fire-and-forget — siempre se despachan a una queue de BullMQ (regla de negocio no negociable, ver `CLAUDE.md`):

```typescript
// src/modules/accounts/accounts.service.ts
@Injectable()
export class AccountsService {
  constructor(
    @InjectQueue('breaches') private readonly breachesQueue: Queue,
  ) {}

  async createScan(userId: number, dto: CreateScanDto) {
    const scan = await this.scansRepo.create(userId, dto)

    // ✅ Correcto — el side effect va a una queue
    await this.breachesQueue.add('lookup', { userId, scanId: scan.id })

    return scan
  }
}
```

```typescript
// src/modules/breaches/breaches.processor.ts
@Processor('breaches')
export class BreachesProcessor {
  @Process('lookup')
  async handleLookup(job: Job<{ userId: number; scanId: number }>) {
    // Consulta a Have I Been Pwned y guarda las brechas encontradas
  }
}
```

```typescript
// ❌ Incorrecto — el fire-and-forget oculta errores
void this.breachesService.lookup(userId, scan.id)
```

## Logging y monitoreo

### Logging estructurado

```typescript
import { Logger } from '@nestjs/common'

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name)

  async search(query: string) {
    this.logger.log(`Searching content: ${query}`)

    try {
      return await this.contentRepo.searchLocal(query)
    } catch (error) {
      this.logger.error(`Failed to search content: ${query}`, (error as Error).stack)
      throw error
    }
  }
}
```

**Recordá**: los patrones de backend habilitan aplicaciones server-side escalables y mantenibles. Elegí los patrones que encajen con tu nivel de complejidad, y seguí siempre `rules/nestjs.md` para la estructura de módulos.
