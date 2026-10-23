---
name: docker-patterns
description: Docker and Docker Compose patterns for local development, container security, networking, volume strategies, and multi-service orchestration.
origin: ECC
---

# Patrones de Docker

Best practices de Docker y Docker Compose para desarrollo containerizado.

## Cuándo activarlo

- Al configurar Docker Compose para desarrollo local
- Al diseñar arquitecturas multi-contenedor
- Al resolver problemas de networking o volúmenes de contenedores
- Al revisar Dockerfiles por seguridad y tamaño
- Al migrar de dev local a un flujo containerizado

## Docker Compose para desarrollo local

### Stack estándar de app web

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: dev                     # Usar el stage dev del Dockerfile multi-stage
    ports:
      - "3000:3000"
    volumes:
      - .:/app                        # Bind mount para hot reload
      - /app/node_modules             # Volumen anónimo -- preserva las deps del contenedor
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://redis:6379/0
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  mailpit:                            # Testing de email local
    image: axllent/mailpit
    ports:
      - "8025:8025"                   # Web UI
      - "1025:1025"                   # SMTP

volumes:
  pgdata:
  redisdata:
```

### Dockerfile de desarrollo vs producción

```dockerfile
# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage: dev (hot reload, tools de debug)
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage: production (imagen mínima)
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

### Archivos de override

```yaml
# docker-compose.override.yml (se carga automático, settings solo de dev)
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "9229:9229"                   # Debugger de Node.js

# docker-compose.prod.yml (explícito para producción)
services:
  app:
    build:
      target: production
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

```bash
# Desarrollo (carga el override automáticamente)
docker compose up

# Producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Networking

### Service Discovery

Los servicios en la misma red de Compose se resuelven por el nombre del servicio:
```
# Desde el contenedor "app":
postgres://postgres:postgres@db:5432/app_dev    # "db" resuelve al contenedor db
redis://redis:6379/0                             # "redis" resuelve al contenedor redis
```

### Redes custom

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net              # Solo alcanzable desde api, no desde frontend

networks:
  frontend-net:
  backend-net:
```

### Exponer solo lo necesario

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"   # Solo accesible desde el host, no desde la red
    # Omitir ports por completo en producción -- accesible solo dentro de la red de Docker
```

## Estrategias de volúmenes

```yaml
volumes:
  # Volumen con nombre: persiste entre reinicios del contenedor, manejado por Docker
  pgdata:

  # Bind mount: mapea un directorio del host al contenedor (para desarrollo)
  # - ./src:/app/src

  # Volumen anónimo: preserva contenido generado por el contenedor de un bind mount override
  # - /app/node_modules
```

### Patrones comunes

```yaml
services:
  app:
    volumes:
      - .:/app                   # Código fuente (bind mount para hot reload)
      - /app/node_modules        # Proteger el node_modules del contenedor del host
      - /app/.next               # Proteger la cache de build

  db:
    volumes:
      - pgdata:/var/lib/postgresql/data          # Datos persistentes
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql  # Scripts de init
```

## Seguridad de contenedores

### Hardening del Dockerfile

```dockerfile
# 1. Usar tags específicos (nunca :latest)
FROM node:22.12-alpine3.20

# 2. Correr como non-root
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app

# 3. Quitar capabilities (en compose)
# 4. Filesystem raíz read-only donde sea posible
# 5. Sin secrets en las layers de la imagen
```

### Seguridad en Compose

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/.cache
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE          # Solo si se bindea a puertos < 1024
```

### Manejo de secrets

```yaml
# BIEN: usar variables de entorno (inyectadas en runtime)
services:
  app:
    env_file:
      - .env                     # Nunca commitear .env a git
    environment:
      - API_KEY                  # Hereda del entorno del host

# BIEN: Docker secrets (modo Swarm)
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  db:
    secrets:
      - db_password

# MAL: hardcodeado en la imagen
# ENV API_KEY=sk-proj-xxxxx      # NUNCA HACER ESTO
```

## .dockerignore

```
node_modules
.git
.env
.env.*
dist
coverage
*.log
.next
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
```

## Debugging

### Comandos comunes

```bash
# Ver logs
docker compose logs -f app           # Seguir los logs de app
docker compose logs --tail=50 db     # Últimas 50 líneas de db

# Ejecutar comandos en un contenedor corriendo
docker compose exec app sh           # Shell dentro de app
docker compose exec db psql -U postgres  # Conectarse a postgres

# Inspeccionar
docker compose ps                     # Servicios corriendo
docker compose top                    # Procesos en cada contenedor
docker stats                          # Uso de recursos

# Rebuild
docker compose up --build             # Rebuildear imágenes
docker compose build --no-cache app   # Forzar rebuild completo

# Limpieza
docker compose down                   # Parar y eliminar contenedores
docker compose down -v                # También eliminar volúmenes (DESTRUCTIVO)
docker system prune                   # Eliminar imágenes/contenedores sin uso
```

### Debuggear problemas de red

```bash
# Chequear resolución DNS dentro del contenedor
docker compose exec app nslookup db

# Chequear conectividad
docker compose exec app wget -qO- http://api:3000/health

# Inspeccionar la red
docker network ls
docker network inspect <project>_default
```

## Anti-patrones

```
# MAL: usar docker compose en producción sin orquestación
# Usar Kubernetes, ECS, o Docker Swarm para workloads multi-contenedor de producción

# MAL: guardar datos en contenedores sin volúmenes
# Los contenedores son efímeros -- todos los datos se pierden al reiniciar sin volúmenes

# MAL: correr como root
# Siempre crear y usar un usuario non-root

# MAL: usar el tag :latest
# Fijar versiones específicas para builds reproducibles

# MAL: un contenedor gigante con todos los servicios
# Separar responsabilidades: un proceso por contenedor

# MAL: poner secrets en docker-compose.yml
# Usar archivos .env (gitignored) o Docker secrets
```
