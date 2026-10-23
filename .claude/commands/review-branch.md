---
name: review-branch
description: Revisa los cambios pendientes (staged/branch) contra las reglas propias de Borrar mi vida digital (CLAUDE.md + .agent/rules) antes de mergear — DTO/validación, Drizzle, BullMQ, reglas de negocio (titularidad del correo, cero credenciales, datos cifrados), Atomic Design en Vue, diseño retro B&N, seguridad. No modifica nada, solo reporta con severidad Critical/Major/Minor y veredicto Go/No-Go. Trigger cuando el usuario dice "revisa esta rama", "review antes de mergear", "/review-branch".
origin: adapted from Wirage's review-branch-wirage
---

# Skill: review-branch

Revisión pre-merge de los cambios pendientes en el monorepo Borrar mi vida digital (`apps/api` NestJS + `apps/web` Vue 3) contra las reglas propias del proyecto (`CLAUDE.md` y `.agent/rules/**`), no genéricas. Se diferencia de un `/code-review` genérico: acá el checklist es específico de las convenciones de Borrar mi vida digital (Drizzle, DTO+class-validator, BullMQ para side effects, Atomic Design, reglas de negocio de verificación/cuentas/pedidos legales), no una revisión de calidad de código en abstracto. **NO modifica código** — solo reporta.

## Cuándo invocar

- `/review-branch`
- "revisa esta rama", "review antes de mergear", "qué le falta a este cambio", "auditá mis cambios contra las reglas de Borrar mi vida digital".

**Modo default (sin `--pasaje`): review liviana.** Aplica el checklist del Paso 3 directamente, sin dispatchear subagentes — más rápido y sin gastar tokens extra en revisiones intermedias durante el desarrollo del ticket. Pasa directo del Paso 3 al Paso 5 (se omite el Paso 4).

**Con `--pasaje`: review completa.** Corre los checks automáticos y la suite E2E (Paso 4b) y dispatchea los agentes especializados del Paso 4, además del checklist inline. Reservar para el pasaje final de un ticket — antes de abrir el PR / mergear a `develop`, no en cada chequeo intermedio del mismo ticket.

## Flags opcionales

- `--pasaje` — activa el Paso 4 (dispatch de agentes especializados `code-reviewer`/`security-reviewer`/`database-reviewer`/`vue-reviewer`/`typescript-reviewer`). Sin este flag, la review usa solo el checklist inline del Paso 3. Usar en el pasaje final de un ticket, no en cada revisión intermedia.
- `--sin-e2e` — con `--pasaje`, omite la suite E2E del Paso 4b (solo si no se puede levantar el entorno; el reporte lo deja anotado como no verificado).
- `--base <rama>` — rama/commit contra el que comparar. Default: `HEAD` si los cambios están staged/sin commitear sobre `main`; si hay una rama feature, default `main`.
- `--capa <backend|frontend|db|tests>` — restringe la revisión a una sola capa. Default: todas las que tengan cambios.

## Workflow

### Paso 1 — Detectar el diff

```bash
git status --porcelain
git diff HEAD --stat        # cambios staged sin commitear
git diff <base>...HEAD --stat  # si hay rama feature separada de main
```

No asumir el rango si es ambiguo (varios commits sueltos vs. working tree) — preguntar si no es obvio.

### Paso 2 — Clasificar archivos por capa

Agrupar por: `backend` (`apps/api/src/modules/**`, `apps/api/src/database/**`), `frontend` (`apps/web/src/**`), `db` (`apps/api/src/database/schema.ts`, migraciones en `apps/api/drizzle/**` si existen), `tests` (`*.spec.ts`, `*.e2e-spec.ts`, `*.test.ts`), `docs` (`docs/**`).

### Paso 3 — Aplicar el checklist según capa

#### Backend (NestJS — `apps/api`)

- Un controller por módulo, sin lógica de negocio ahí — todo en el service (`.agent/rules/nestjs.md` §5-6).
- Todo body de request tiene DTO con `class-validator` + `@ApiProperty()`. Nunca validar a mano dentro del service (§6).
- Solo excepciones HTTP de Nest (`NotFoundException`, `ForbiddenException`, `ConflictException`, etc.) — nunca `Error` genérico ni `HttpException` vago (§7).
- Rutas protegidas usan `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` — nunca `req.user` a mano (§9).
- Ningún servicio importa el service de otro módulo directamente sin pasar por `imports: [OtroModule]` + export.
- Respuesta de paginación incluye `data`, `total`, `page`, `limit`; controllers devuelven data plana, no envuelven manualmente (el interceptor global lo hace) (§10).
- **Side effects (envío de códigos, consultas a HIBP, recordatorios) siempre vía cola BullMQ.** Un `void promise()` o fire-and-forget sin cola es **Critical** (regla de negocio 5 de `CLAUDE.md`, §11 de `nestjs.md`).
- **Regla de negocio 1**: ningún endpoint de descubrimiento (filtraciones, importaciones, catálogo por correo) corre sobre un correo sin verificación de titularidad vigente → **Critical**.
- **Regla de negocio 2**: el producto nunca recibe, guarda ni loguea contraseñas. El import de CSV del navegador descarta la columna de contraseña en el cliente, antes de subir nada → si una contraseña llega al backend, **Critical**.
- **Regla de negocio 3**: la lista de cuentas del usuario se guarda cifrada en reposo y tiene borrado total disponible → columna en claro con el mapa de cuentas, **Critical**.
- **Regla de negocio 4**: nunca llamar a APIs externas (HIBP) desde el frontend; siempre vía backend + cola, con rate limit.

#### Base de datos (Drizzle — `apps/api/src/database/schema.ts`)

- Toda columna nueva pasa por `DrizzleService` — nunca instanciar el cliente Drizzle fuera de ahí.
- **Nunca** seleccionar filas completas cuando hay campos sensibles (`passwordHash`, tokens) — debe haber `columns: {...}` explícito. Devolver la entidad completa de `users` es **Critical** (regla de negocio 5).
- `db.transaction()` cuando hay múltiples writes que deben ser atómicos (ej. cerrar una cuenta + registrar el pedido legal asociado).
- Índices en FKs nuevas y en columnas usadas en `WHERE`/`ORDER BY` de queries frecuentes.
- Si se agregó una tabla/columna nueva a `schema.ts`, verificar que exista la migración correspondiente generada (`drizzle-kit generate`) — schema sin migración asociada es **Major**.

#### Frontend (Vue 3 — `apps/web`)

- Atomic Design respetado: átomos sin store ni composables de datos; moléculas compuestas solo de átomos (nunca `<input>`/`<select>` crudos si existe `BaseInput`/`BaseSelect`); organismos pueden usar store/composables; templates sin fetch de datos; solo las páginas conectan a router/store (`.agent/rules/vue.md` §6).
- `defineProps`/`defineEmits` siempre tipados explícitamente — nunca `defineProps([...])` sin tipos (§6 vue.md).
- Componentes nuevos: ¿ya existía un átomo/molécula que resolvía esto? (`BasePopoverPanel`, `BaseModal`, etc.) Si se reimplementó algo que ya existía → **Major**.
- Ningún componente llama a un servicio HTTP directo — siempre a través de un store o composable (§7-8 vue.md).
- `storeToRefs()` al desestructurar estado reactivo de un store, nunca destructuring directo (§7 vue.md).
- **Diseño** (`docs/DESIGN.md`): solo blanco y negro (tokens, nunca hex sueltos ni colores de acento); animaciones con `transform`/`opacity`, respetan `prefers-reduced-motion`; tipografía y componentes del sistema retro. Un color fuera de la paleta o una animación sin fallback reducido → **Major**.
- Composables nuevos (`useX`) solo si la lógica se reutiliza o amerita test aislado — si se usa en un solo componente y es trivial, es sobreingeniería (**Minor**).

#### Tests

- Cobertura mínima 80% para lógica de negocio no trivial (servicios, composables complejos).
- Naming `*.service.spec.ts` (unit, mockeando el provider `DRIZZLE`) — nunca contra DB real en unit tests (`.agent/rules/nestjs.md` §12).
- Estructura AAA (Arrange-Act-Assert), nombres descriptivos de qué comportamiento se prueba (`.agent/rules/common/testing.md`).
- Servicio/feature nueva sin test correspondiente → **Major**.

#### Seguridad (transversal, todas las capas)

Aplicar `.agent/rules/common/security.md` + `.agent/rules/typescript/security.md`:

- Secrets hardcodeados (API keys, passwords, tokens) → **Critical**.
- Inputs de usuario sin validar en un boundary (DTO faltante, o `unknown`/`any` sin narrowing) → **Major**/**Critical** según el endpoint.
- Concatenación de strings en queries (aunque Drizzle parametriza por default, cualquier `sql\`...\`` con interpolación directa de input de usuario) → **Critical**.
- Falta de chequeo de autorización antes de mutar un recurso de otro usuario (ej. cambiar el estado de una cuenta o leer un pedido de supresión sin verificar ownership) → **Critical**.
- Datos sensibles en logs o en mensajes de error devueltos al cliente → **Major**.
- Rate limiting ausente en endpoints costosos (búsqueda, creación masiva) → **Minor**/**Major** según impacto.

#### Transversal (todas las capas)

- KISS/DRY/YAGNI (`.agent/rules/common/coding-style.md`): abstracciones nuevas sin valor medible → **Minor** (o **Major** si duplica algo que ya existía en `src/types/`, `src/utils/`, `src/constants/`, `src/composables/`).
- "Search before you create": constante/tipo/helper que ya existía en otro lado y se volvió a definir localmente → **Major**.
- Sin `console.log` en código de producción.
- Inmutabilidad: mutación directa de objetos/arrays en vez de spread/copia → **Minor**.
- Ningún `git commit`/`git push` hecho por el propio agente sin pedido explícito del usuario.

### Paso 4 — Delegar en los agentes especializados (solo con `--pasaje`)

**Omitir este paso por default.** Solo corre cuando el usuario pasó `--pasaje` (pasaje final del ticket, pre-PR/pre-merge) — en el día a día del ticket, el checklist inline del Paso 3 alcanza y evita gastar tokens de más en subagentes. Cuando sí corresponde: dispatchear en **paralelo** (un solo mensaje, múltiples tool calls `Agent`) los agentes de `.claude/agents/` que correspondan según qué capas tocó el diff. Cada agente es un subagente fresco (no fork) — su prompt debe incluir, self-contained:

- La lista de archivos de esa capa (del Paso 2) y el rango de diff (`git diff <base>...HEAD -- <archivos>`), no solo los nombres.
- El sub-checklist relevante del Paso 3 pegado literal (son las reglas de Borrar mi vida digital, no genéricas — el agente no las conoce por defecto).
- El pedido explícito de reportar hallazgos con severidad **Critical/Major/Minor**, cada uno con `archivo:línea`, mismo formato que el Paso 5. **No debe modificar código.**

Mapeo capa → agente (acumulativo, un archivo puede disparar más de uno):

| Condición en el diff | Agente a invocar |
|---|---|
| Siempre que haya cualquier cambio | `code-reviewer` (calidad general, KISS/DRY/YAGNI, checklist Transversal) |
| `apps/api/src/modules/**`, `apps/api/src/database/**` (capa backend) | `database-reviewer` si toca `schema.ts`/`drizzle/**`; si no, el checklist de Backend lo cubre `code-reviewer` |
| Cambios en `**/auth/**`, `**/guards/**`, JWT, OAuth, validación de inputs sensibles | `security-reviewer` (obligatorio — regla de negocio y `.agent/rules/common/security.md`) |
| `apps/web/src/**/*.vue`, cambios en stores/composables de Vue | `vue-reviewer` |
| Tipos complejos, generics, interfaces no triviales (backend o frontend) | `typescript-reviewer` |
| Queries Drizzle, migraciones, índices (`apps/api/drizzle/**`, `schema.ts`) | `database-reviewer` |

Si una capa no tuvo cambios, no dispatchear su agente — evitar ruido y costo innecesario.

### Paso 4b — Checks automáticos y suite E2E (solo con `--pasaje`)

Los revisores leen código; esto lo **ejecuta**. Corre antes (o en paralelo) a los agentes y su resultado entra al reporte:

1. `pnpm lint`, `pnpm typecheck` y `pnpm test` (todo en verde).
2. **Suite E2E con Playwright** (`apps/e2e`, ver `docs/E2E.md`): `pnpm e2e`.
   - Requisitos: Postgres y Redis arriba (`pnpm docker:up`), migraciones aplicadas (`pnpm db:migrate`) y Chromium instalado (`pnpm --filter @borrar/e2e exec playwright install chromium`). La suite levanta su propia API (puerto 3300) y su front (5180), sin tocar `pnpm dev`, y crea/borra solo su usuario y sus listas `E2E ...`.
   - Cualquier prueba E2E que falle es **Major como mínimo**; si falla el humo (`smoke`), la autenticación o una ruta que antes andaba, es **Critical** (bloquea el merge). Una prueba intermitente (`flaky`) se reporta como Minor con su nombre.
   - Si el diff agrega o cambia una pantalla, flujo o endpoint y la suite no lo cubre, es un hallazgo **Major** ("falta prueba E2E de ...") y se agrega la prueba en `apps/e2e/tests` antes de dar Go.
3. Tras un cambio de red o de despliegue (host de `listen`, puertos, nginx, healthchecks, Docker), validarlo con el **stack real** en Docker y desde un segundo contenedor de la misma red, no con un servidor de reemplazo: Fastify sin host escucha solo en loopback y el healthcheck de adentro del contenedor pasa igual.

Si no se puede ejecutar algo, el reporte lo dice como **no verificado**: nunca se da por bueno.

**Instrucción para los subagentes del Paso 4:** además de ser solo lectura, no deben cambiar de rama ni tocar el estado de git (nada de `checkout`, `switch`, `stash`, `reset`, `add`, `commit`): trabajan sobre el working tree actual con `git diff <base>` y leen directo los archivos nuevos sin trackear.

### Paso 5 — Generar el reporte

No crea archivo por default — se imprime en el chat. Si el usuario pide `--guardar`, escribir en `docs/reviews/review-branch-<fecha>.md` con el mismo formato.

Formato:

```markdown
# Review de rama — <fecha>

## Resumen
- Capas con cambios: backend, frontend, db
- Archivos revisados: N

## Verificación automática (con `--pasaje`)
- lint / typecheck / tests: ✅ o ❌ (cuántos)
- E2E (`pnpm e2e`): N pasaron, N fallaron, N intermitentes (o "no verificado" y por qué)

## 🔴 Critical (bloquea el merge)
- [Backend] archivo:línea — descripción

## 🟠 Major (corregir antes de mergear salvo justificación)
- [Frontend] archivo:línea — descripción

## 🟡 Minor (deuda aceptable, dejar anotado)
- [Transversal] archivo:línea — descripción

## Veredicto
**Go** / **No-Go** — justificación en 1-2 líneas.
```

### Paso 6 — Reportar al usuario

Mensaje final directo (sin relleno): total de hallazgos por severidad y el veredicto. Si es No-Go, decir explícitamente qué falta resolver antes de mergear.

## Reglas duras

1. **NO modificar ningún archivo de código.** Skill de solo lectura.
2. **No asumir el rango del diff** si es ambiguo — preguntar.
3. **Priorizar por severidad**, no por volumen de hallazgos.
4. **Cada hallazgo con path + línea** cuando sea posible.
5. **Output en español**, directo, sin relleno.

## Archivos de referencia

- Reglas fuente: `CLAUDE.md`, `.agent/rules/common/*.md`, `.agent/rules/typescript/*.md`, `.agent/rules/vue.md`, `.agent/rules/nestjs.md`.
- Reglas de negocio críticas: sección "Reglas de negocio críticas" de `CLAUDE.md`.
