---
name: deployment-patterns
description: Deployment workflows, CI/CD pipeline patterns, Docker containerization, health checks, rollback strategies, and production readiness checklists for web applications.
origin: ECC
---

# Patrones de deployment

Flujos de deployment de producción y best practices de CI/CD.

## Cuándo activarlo

- Al configurar pipelines de CI/CD
- Al dockerizar una aplicación
- Al planificar la estrategia de deployment (blue-green, canary, rolling)
- Al implementar health checks y readiness probes
- Al preparar un release de producción
- Al configurar settings específicos de entorno

## Estrategias de deployment

### Rolling Deployment (default)

Reemplazar instancias gradualmente — las versiones vieja y nueva corren simultáneamente durante el rollout.

```
Instancia 1: v1 → v2  (se actualiza primero)
Instancia 2: v1        (todavía corriendo v1)
Instancia 3: v1        (todavía corriendo v1)

Instancia 1: v2
Instancia 2: v1 → v2  (se actualiza segunda)
Instancia 3: v1

Instancia 1: v2
Instancia 2: v2
Instancia 3: v1 → v2  (se actualiza última)
```

**Pros:** cero downtime, rollout gradual
**Contras:** dos versiones corren simultáneamente — requiere cambios backward-compatible
**Usar cuando:** deployments estándar, cambios backward-compatible

### Blue-Green Deployment

Correr dos entornos idénticos. Cambiar el tráfico atómicamente.

```
Blue  (v1) ← tráfico
Green (v2)   idle, corriendo la versión nueva

# Después de verificar:
Blue  (v1)   idle (se convierte en standby)
Green (v2) ← tráfico
```

**Pros:** rollback instantáneo (volver a blue), cutover limpio
**Contras:** requiere 2x infraestructura durante el deployment
**Usar cuando:** servicios críticos, cero tolerancia a issues

### Canary Deployment

Rutear un pequeño porcentaje del tráfico a la versión nueva primero.

```
v1: 95% del tráfico
v2:  5% del tráfico  (canary)

# Si las métricas se ven bien:
v1: 50% del tráfico
v2: 50% del tráfico

# Final:
v2: 100% del tráfico
```

**Pros:** detecta issues con tráfico real antes del rollout completo
**Contras:** requiere infraestructura de traffic splitting, monitoreo
**Usar cuando:** servicios de alto tráfico, cambios riesgosos, feature flags

## Docker

### Dockerfile multi-stage (Node.js)

```dockerfile
# Stage 1: Instalar dependencias
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Imagen de producción
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### Dockerfile multi-stage (Go)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.19 AS runner
RUN apk --no-cache add ca-certificates
RUN adduser -D -u 1001 appuser
USER appuser

COPY --from=builder /server /server

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["/server"]
```

### Dockerfile multi-stage (Python/Django)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app

RUN useradd -r -u 1001 appuser
USER appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')" || exit 1
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Best Practices de Docker

```
# Prácticas BUENAS
- Usar tags de versión específicos (node:22-alpine, no node:latest)
- Builds multi-stage para minimizar el tamaño de la imagen
- Correr como usuario non-root
- Copiar los archivos de dependencias primero (layer caching)
- Usar .dockerignore para excluir node_modules, .git, tests
- Agregar la instrucción HEALTHCHECK
- Setear límites de recursos en docker-compose o k8s

# Prácticas MALAS
- Correr como root
- Usar tags :latest
- Copiar todo el repo en una sola layer COPY
- Instalar dependencias de dev en la imagen de producción
- Guardar secrets en la imagen (usar env vars o secrets manager)
```

## Pipeline de CI/CD

### GitHub Actions (Pipeline estándar)

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Comando de deployment específico de la plataforma
          # Railway: railway up
          # Vercel: vercel --prod
          # K8s: kubectl set image deployment/app app=ghcr.io/${{ github.repository }}:${{ github.sha }}
          echo "Deploying ${{ github.sha }}"
```

### Etapas del pipeline

```
PR abierto:
  lint → typecheck → unit tests → integration tests → preview deploy

Merge a main:
  lint → typecheck → unit tests → integration tests → build image → deploy staging → smoke tests → deploy production
```

## Health Checks

### Endpoint de health check

```typescript
// Health check simple
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Health check detallado (para monitoreo interno)
app.get("/health/detailed", async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "unknown",
    uptime: process.uptime(),
    checks,
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.query("SELECT 1");
    return { status: "ok", latency_ms: 2 };
  } catch (err) {
    return { status: "error", message: "Database unreachable" };
  }
}
```

### Probes de Kubernetes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30    # 30 * 5s = 150s de tiempo máximo de startup
```

## Configuración de entorno

### Patrón Twelve-Factor App

```bash
# Toda la config vía variables de entorno — nunca en el código
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
API_KEY=${API_KEY}           # inyectada por el secrets manager
LOG_LEVEL=info
PORT=3000

# Comportamiento específico de entorno
NODE_ENV=production          # o staging, development
APP_ENV=production           # entorno de app explícito
```

### Validación de configuración

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

// Validar al arrancar — fallar rápido si la config está mal
export const env = envSchema.parse(process.env);
```

## Estrategia de Rollback

### Rollback instantáneo

```bash
# Docker/Kubernetes: apuntar a la imagen anterior
kubectl rollout undo deployment/app

# Vercel: promover el deployment anterior
vercel rollback

# Railway: redeployar el commit anterior
railway up --commit <previous-sha>

# Base de datos: rollback de migración (si es reversible)
npx prisma migrate resolve --rolled-back <migration-name>
```

### Checklist de rollback

- [ ] La imagen/artifact anterior está disponible y tagueada
- [ ] Las migraciones de base de datos son backward-compatible (sin cambios destructivos)
- [ ] Los feature flags pueden deshabilitar features nuevas sin un deploy
- [ ] Alertas de monitoreo configuradas para picos en la tasa de error
- [ ] El rollback se testeó en staging antes del release de producción

## Checklist de production readiness

Antes de cualquier deployment de producción:

### Aplicación
- [ ] Todos los tests pasan (unit, integration, E2E)
- [ ] Sin secrets hardcodeados en el código o archivos de config
- [ ] El manejo de errores cubre todos los edge cases
- [ ] El logging es estructurado (JSON) y no contiene PII
- [ ] El endpoint de health check devuelve un status significativo

### Infraestructura
- [ ] La imagen de Docker buildea de forma reproducible (versiones fijadas)
- [ ] Las variables de entorno están documentadas y validadas al arrancar
- [ ] Los límites de recursos están seteados (CPU, memoria)
- [ ] El escalado horizontal está configurado (instancias min/max)
- [ ] SSL/TLS habilitado en todos los endpoints

### Monitoreo
- [ ] Se exportan métricas de la aplicación (tasa de requests, latencia, errores)
- [ ] Alertas configuradas para tasa de error > umbral
- [ ] Agregación de logs configurada (logs estructurados, buscables)
- [ ] Monitoreo de uptime en el endpoint de health

### Seguridad
- [ ] Las dependencias fueron escaneadas por CVEs
- [ ] CORS configurado solo para los orígenes permitidos
- [ ] Rate limiting habilitado en endpoints públicos
- [ ] Autenticación y autorización verificadas
- [ ] Security headers seteados (CSP, HSTS, X-Frame-Options)

### Operaciones
- [ ] Plan de rollback documentado y testeado
- [ ] Migración de base de datos testeada contra datos del tamaño de producción
- [ ] Runbook para escenarios de falla comunes
- [ ] Rotación de on-call y path de escalamiento definidos
