---
name: api-design
description: REST API design patterns including resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting for production APIs.
origin: ECC
---

# Patrones de diseño de API

Convenciones y best practices para diseñar APIs REST consistentes y agradables para desarrolladores.

## Cuándo activarlo

- Al diseñar endpoints de API nuevos
- Al revisar contratos de API existentes
- Al agregar paginación, filtrado, u ordenamiento
- Al implementar manejo de errores para APIs
- Al planificar la estrategia de versionado de API
- Al construir APIs públicas o de cara a partners

## Diseño de recursos

### Estructura de URL

```
# Los recursos son sustantivos, plural, minúsculas, kebab-case
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# Sub-recursos para relaciones
GET    /api/v1/users/:id/orders
POST   /api/v1/users/:id/orders

# Acciones que no mapean a CRUD (usar verbos con moderación)
POST   /api/v1/orders/:id/cancel
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
```

### Reglas de naming

```
# BIEN
/api/v1/team-members          # kebab-case para recursos multi-palabra
/api/v1/orders?status=active  # query params para filtrado
/api/v1/users/123/orders      # recursos anidados para ownership

# MAL
/api/v1/getUsers              # verbo en la URL
/api/v1/user                  # singular (usar plural)
/api/v1/team_members          # snake_case en URLs
/api/v1/users/123/getOrders   # verbo en recurso anidado
```

## Métodos HTTP y status codes

### Semántica de los métodos

| Método | Idempotente | Seguro | Usar para |
|--------|-----------|------|---------|
| GET | Sí | Sí | Traer recursos |
| POST | No | No | Crear recursos, disparar acciones |
| PUT | Sí | No | Reemplazo completo de un recurso |
| PATCH | No* | No | Update parcial de un recurso |
| DELETE | Sí | No | Eliminar un recurso |

*PATCH puede hacerse idempotente con una implementación apropiada

### Referencia de status codes

```
# Éxito
200 OK                    — GET, PUT, PATCH (con response body)
201 Created               — POST (incluir header Location)
204 No Content            — DELETE, PUT (sin response body)

# Errores de cliente
400 Bad Request           — Falla de validación, JSON malformado
401 Unauthorized          — Autenticación faltante o inválida
403 Forbidden             — Autenticado pero no autorizado
404 Not Found             — El recurso no existe
409 Conflict              — Entrada duplicada, conflicto de estado
422 Unprocessable Entity  — Semánticamente inválido (JSON válido, datos malos)
429 Too Many Requests     — Rate limit excedido

# Errores de servidor
500 Internal Server Error — Falla inesperada (nunca exponer detalles)
502 Bad Gateway           — Falló un servicio upstream
503 Service Unavailable   — Sobrecarga temporal, incluir Retry-After
```

### Errores comunes

```
# MAL: 200 para todo
{ "status": 200, "success": false, "error": "Not found" }

# BIEN: usar los status codes HTTP semánticamente
HTTP/1.1 404 Not Found
{ "error": { "code": "not_found", "message": "User not found" } }

# MAL: 500 para errores de validación
# BIEN: 400 o 422 con detalle a nivel de campo

# MAL: 200 para recursos creados
# BIEN: 201 con header Location
HTTP/1.1 201 Created
Location: /api/v1/users/abc-123
```

## Formato de respuesta

### Respuesta de éxito

```json
{
  "data": {
    "id": "abc-123",
    "email": "alice@example.com",
    "name": "Alice",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Respuesta de colección (con paginación)

```json
{
  "data": [
    { "id": "abc-123", "name": "Alice" },
    { "id": "def-456", "name": "Bob" }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1&per_page=20",
    "next": "/api/v1/users?page=2&per_page=20",
    "last": "/api/v1/users?page=8&per_page=20"
  }
}
```

### Respuesta de error

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_format"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150",
        "code": "out_of_range"
      }
    ]
  }
}
```

### Variantes del envelope de respuesta

```typescript
// Opción A: envelope con wrapper de data (recomendado para APIs públicas)
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

// Opción B: respuesta plana (más simple, común en APIs internas)
// Éxito: devolver el recurso directamente
// Error: devolver el objeto error
// Distinguir por el status code HTTP
```

## Paginación

### Basada en offset (simple)

```
GET /api/v1/users?page=2&per_page=20

# Implementación
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 20 OFFSET 20;
```

**Pros:** fácil de implementar, soporta "saltar a la página N"
**Contras:** lento en offsets grandes (OFFSET 100000), inconsistente con inserts concurrentes

### Basada en cursor (escalable)

```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20

# Implementación
SELECT * FROM users
WHERE id > :cursor_id
ORDER BY id ASC
LIMIT 21;  -- traer uno extra para determinar has_next
```

```json
{
  "data": [...],
  "meta": {
    "has_next": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

**Pros:** performance consistente sin importar la posición, estable con inserts concurrentes
**Contras:** no se puede saltar a una página arbitraria, el cursor es opaco

### Cuál usar cuándo

| Caso de uso | Tipo de paginación |
|----------|----------------|
| Dashboards de admin, datasets chicos (<10K) | Offset |
| Infinite scroll, feeds, datasets grandes | Cursor |
| APIs públicas | Cursor (default) con offset (opcional) |
| Resultados de búsqueda | Offset (los usuarios esperan números de página) |

## Filtrado, ordenamiento y búsqueda

### Filtrado

```
# Igualdad simple
GET /api/v1/orders?status=active&customer_id=abc-123

# Operadores de comparación (usar notación de corchetes)
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/orders?created_at[after]=2025-01-01

# Múltiples valores (separados por coma)
GET /api/v1/products?category=electronics,clothing

# Campos anidados (notación de punto)
GET /api/v1/orders?customer.country=US
```

### Ordenamiento

```
# Un solo campo (prefijo - para descendente)
GET /api/v1/products?sort=-created_at

# Múltiples campos (separados por coma)
GET /api/v1/products?sort=-featured,price,-created_at
```

### Búsqueda de texto completo

```
# Query param de búsqueda
GET /api/v1/products?q=wireless+headphones

# Búsqueda específica de un campo
GET /api/v1/users?email=alice
```

### Sparse Fieldsets

```
# Devolver solo los campos especificados (reduce el payload)
GET /api/v1/users?fields=id,name,email
GET /api/v1/orders?fields=id,total,status&include=customer.name
```

## Autenticación y autorización

### Auth basada en token

```
# Bearer token en el header Authorization
GET /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# API key (para server-to-server)
GET /api/v1/data
X-API-Key: sk_live_abc123
```

### Patrones de autorización

```typescript
// A nivel de recurso: chequear ownership
app.get("/api/v1/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: { code: "not_found" } });
  if (order.userId !== req.user.id) return res.status(403).json({ error: { code: "forbidden" } });
  return res.json({ data: order });
});

// Basada en rol: chequear permisos
app.delete("/api/v1/users/:id", requireRole("admin"), async (req, res) => {
  await User.delete(req.params.id);
  return res.status(204).send();
});
```

## Rate Limiting

### Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

# Cuando se excede
HTTP/1.1 429 Too Many Requests
Retry-After: 60
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### Tiers de rate limit

| Tier | Límite | Ventana | Caso de uso |
|------|-------|--------|----------|
| Anónimo | 30/min | Por IP | Endpoints públicos |
| Autenticado | 100/min | Por usuario | Acceso estándar a la API |
| Premium | 1000/min | Por API key | Planes de API pagos |
| Interno | 10000/min | Por servicio | Servicio a servicio |

## Versionado

### Versionado por path de URL (recomendado)

```
/api/v1/users
/api/v2/users
```

**Pros:** explícito, fácil de rutear, cacheable
**Contras:** la URL cambia entre versiones

### Versionado por header

```
GET /api/users
Accept: application/vnd.myapp.v2+json
```

**Pros:** URLs limpias
**Contras:** más difícil de testear, fácil de olvidar

### Estrategia de versionado

```
1. Empezar con /api/v1/ — no versionar hasta que sea necesario
2. Mantener como máximo 2 versiones activas (actual + anterior)
3. Timeline de deprecación:
   - Anunciar la deprecación (6 meses de aviso para APIs públicas)
   - Agregar header Sunset: Sunset: Sat, 01 Jan 2026 00:00:00 GMT
   - Devolver 410 Gone después de la fecha de sunset
4. Los cambios no-breaking no necesitan una versión nueva:
   - Agregar campos nuevos a las respuestas
   - Agregar query parameters opcionales nuevos
   - Agregar endpoints nuevos
5. Los cambios breaking requieren una versión nueva:
   - Eliminar o renombrar campos
   - Cambiar tipos de campo
   - Cambiar la estructura de URL
   - Cambiar el método de autenticación
```

## Patrones de implementación

### TypeScript (Next.js API Route)

```typescript
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: parsed.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
    }, { status: 422 });
  }

  const user = await createUser(parsed.data);

  return NextResponse.json(
    { data: user },
    {
      status: 201,
      headers: { Location: `/api/v1/users/${user.id}` },
    },
  );
}
```

### Python (Django REST Framework)

```python
from rest_framework import serializers, viewsets, status
from rest_framework.response import Response

class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "created_at"]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CreateUserSerializer
        return UserSerializer

    def create(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.create(**serializer.validated_data)
        return Response(
            {"data": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
            headers={"Location": f"/api/v1/users/{user.id}"},
        )
```

### Go (net/http)

```go
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_json", "Invalid request body")
        return
    }

    if err := req.Validate(); err != nil {
        writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
        return
    }

    user, err := h.service.Create(r.Context(), req)
    if err != nil {
        switch {
        case errors.Is(err, domain.ErrEmailTaken):
            writeError(w, http.StatusConflict, "email_taken", "Email already registered")
        default:
            writeError(w, http.StatusInternalServerError, "internal_error", "Internal error")
        }
        return
    }

    w.Header().Set("Location", fmt.Sprintf("/api/v1/users/%s", user.ID))
    writeJSON(w, http.StatusCreated, map[string]any{"data": user})
}
```

## Checklist de diseño de API

Antes de shippear un endpoint nuevo:

- [ ] La URL del recurso sigue las convenciones de naming (plural, kebab-case, sin verbos)
- [ ] Se usa el método HTTP correcto (GET para lecturas, POST para creaciones, etc.)
- [ ] Se devuelven los status codes apropiados (no 200 para todo)
- [ ] El input está validado con un esquema (Zod, Pydantic, Bean Validation)
- [ ] Las respuestas de error siguen el formato estándar con codes y messages
- [ ] Se implementó paginación para los endpoints de listado (cursor u offset)
- [ ] Se requiere autenticación (o está explícitamente marcado como público)
- [ ] Se chequea autorización (el usuario solo puede acceder a sus propios recursos)
- [ ] Rate limiting configurado
- [ ] La respuesta no filtra detalles internos (stack traces, errores de SQL)
- [ ] Naming consistente con los endpoints existentes (camelCase vs snake_case)
- [ ] Documentado (spec de OpenAPI/Swagger actualizada)
