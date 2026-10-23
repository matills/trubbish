# AGENTS.md — Borrar mi vida digital

> Entrypoint universal para asistentes de IA (Gemini, Cursor, Codex, Copilot, etc.).
> Para Claude Code específicamente, ver `CLAUDE.md`.

Herramienta web que, a partir de un correo verificado, encuentra las cuentas creadas con él y guía al usuario hasta borrarlas.
Stack: **NestJS + Vue 3 + PostgreSQL + Redis + Drizzle + BullMQ + GSAP**

## Documentación clave

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — producto, entidades, reglas de negocio, roadmap
- [`docs/DESIGN.md`](docs/DESIGN.md) — diseño retro años 60 en blanco y negro y animaciones

## Rules — leer siempre antes de codear

- Comunes: [`.agent/rules/common/`](.agent/rules/common/)
- TypeScript: [`.agent/rules/typescript/`](.agent/rules/typescript/)
- [`.agent/rules/vue.md`](.agent/rules/vue.md) — Vue 3, `<script setup lang="ts">`, Atomic Design, Pinia, composables
- [`.agent/rules/nestjs.md`](.agent/rules/nestjs.md) — módulos, DTOs, class-validator, Drizzle, guards, BullMQ

## Principios no negociables

1. **Leer antes de escribir** — nunca editar un archivo sin entender su contexto
2. **Simplicity First** — mínimo código que resuelve el problema
3. **Surgical Changes** — tocar solo lo necesario
4. **TDD cuando aplica** — tests antes de features no triviales
5. **No `any` en TypeScript**
6. **No llamadas API desde componentes** — siempre vía stores o composables
7. **No lógica de negocio en controllers** — todo en services
8. **Nunca manejar contraseñas del usuario** y nunca buscar sobre un correo sin verificar

Agentes y skills: `.claude/agents/` y `.claude/commands/` (ver tablas en `CLAUDE.md`).
