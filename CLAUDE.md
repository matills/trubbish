# CLAUDE.md — Borrar mi vida digital

> Entrypoint para Claude Code. Este archivo es leído automáticamente al abrir el proyecto.

**Borrar mi vida digital** — herramienta web que, a partir de un correo verificado, encuentra las cuentas creadas con él y guía al usuario hasta borrarlas una por una.
Stack: **NestJS + Vue 3 + TypeScript + PostgreSQL + Redis + Drizzle + BullMQ + GSAP** (monorepo pnpm: `apps/api`, `apps/web`).

---

## Contexto del proyecto

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — **referencia de producto activa**: flujo, entidades, reglas de negocio, roadmap por fases
- [`docs/DESIGN.md`](docs/DESIGN.md) — **referencia de diseño activa**: retro años 60 en blanco y negro, tokens, tipografía, coreografías de animación, qué NO hacer. **Leerlo antes de tocar cualquier `.vue` o CSS**

---

## Rules — seguir siempre

### Comportamiento del agente
- Think before coding. Surface tradeoffs. Ask when uncertain.
- Simplicity First: minimum code, nothing speculative.
- Surgical changes: touch only what the task requires.
- Goal-Driven: define success criteria before implementing.
- UI: antes de crear o modificar un componente/estilo, leer `docs/DESIGN.md` y cumplir su checklist. Toda animación sigue `motion-patterns`. No copiar patrones de los archivos listados en "Deuda conocida" de DESIGN.md.

### Archivos de reglas (leer según contexto)

**Universales:**
@.agent/rules/common/coding-style.md
@.agent/rules/common/development-workflow.md
@.agent/rules/common/testing.md
@.agent/rules/common/security.md
@.agent/rules/common/patterns.md
@.agent/rules/common/code-review.md
@.agent/rules/common/git-workflow.md

**TypeScript:**
@.agent/rules/typescript/coding-style.md
@.agent/rules/typescript/patterns.md
@.agent/rules/typescript/testing.md
@.agent/rules/typescript/security.md

**Frontend (Vue 3):**
@.agent/rules/vue.md

**Backend (NestJS):**
@.agent/rules/nestjs.md

---

## Agents disponibles

Usar `Agent` tool para delegar a sub-agentes cuando aplique (archivos en `.claude/agents/`):

| Agente | Usar cuando... |
|---|---|
| `planner` | Antes de implementar cualquier feature nueva |
| `architect` | Decisiones de arquitectura (cifrado de cuentas, colas, schema) |
| `code-reviewer` | Después de escribir código, antes de commitear |
| `security-reviewer` | Cualquier cambio en auth, verificación de correo, cifrado, imports, pedidos legales |
| `build-error-resolver` | Errores de build TypeScript / Vite / NestJS |
| `refactor-cleaner` | Limpieza y simplificación de código existente |
| `tdd-guide` | Features con lógica de negocio no trivial |
| `typescript-reviewer` | Tipos complejos, generics, interfaces |
| `vue-reviewer` | Cambios en `.vue`: reactividad, composables, Pinia, Vue Router |
| `database-reviewer` | Queries Drizzle, migraciones, índices PostgreSQL |
| `doc-updater` | Después de cambios que afectan la documentación |
| `e2e-runner` | Flujos E2E completos |

---

## Skills disponibles (`.claude/commands/`)

- `nestjs-patterns`, `backend-patterns` — backend
- `drizzle-patterns`, `database-migrations`, `postgres-patterns` — DB
- `redis-patterns` — BullMQ, rate limiting, códigos de verificación
- `frontend-patterns`, `vite-patterns` — frontend Vue
- `motion-patterns` — animaciones GSAP / Transition
- `api-design` — nuevos endpoints REST
- `tdd-workflow`, `e2e-testing` — tests
- `security-review` — auditorías de seguridad
- `docker-patterns`, `deployment-patterns` — infra
- `search-first` — antes de implementar algo nuevo
- `verification-loop` — antes de commitear
- `review-branch` — revisión pre-merge contra las reglas del proyecto

## Skills por archivo/módulo

| Archivo(s) | Skill a aplicar |
|---|---|
| `apps/api/src/modules/**` | `nestjs-patterns`, `backend-patterns` |
| `apps/api/src/database/**`, `schema.ts` | `drizzle-patterns`, `database-migrations` |
| `apps/web/src/components/**`, `apps/web/src/stores/**` | `frontend-patterns` |
| `apps/web/src/composables/motion/**`, cualquier uso de `gsap` | `motion-patterns` |
| `**/auth/**`, `**/verification/**`, `**/imports/**`, `**/guards/**` | `security-review` |
| `apps/api/src/modules/breaches/**`, `**/*.processor.ts` | `redis-patterns` |
| `docker-compose*.yml`, `Dockerfile*` | `docker-patterns` |
| `.github/workflows/**` | `deployment-patterns` |

---

## Reglas de negocio críticas

> Decisiones de diseño no negociables (detalle en `docs/PRODUCT.md`).

1. **Titularidad primero**: ningún método de descubrimiento (filtraciones, imports, catálogo por correo) corre sobre un correo sin verificación de código vigente. Sin esto la herramienta sirve para espiar cuentas ajenas.

2. **Cero credenciales**: el producto nunca recibe, guarda ni loguea contraseñas. El CSV del navegador se parsea en el cliente y solo se suben dominios. Nunca automatizar logins.

3. **Datos mínimos y cifrados**: la lista de cuentas se guarda cifrada en reposo y el usuario puede borrar todo en cualquier momento.

4. **APIs externas solo vía backend + BullMQ**: HIBP y envío de correos van por cola, con rate limit. Nunca `void promise()` ni llamadas externas desde el frontend.

5. **Nunca retornar entidades completas**: en Drizzle, seleccionar explícitamente las columnas; `passwordHash`, códigos y tokens nunca llegan a una respuesta.

6. **Diseño en blanco y negro**: ningún color fuera de los tokens `--paper`/`--ink`; los estados se comunican con forma, textura y texto.
