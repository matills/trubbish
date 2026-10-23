---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Hooks de TypeScript/JavaScript

> Este archivo extiende [common/hooks.md](../common/hooks.md) con contenido específico de TypeScript/JavaScript.

## Hooks de PostToolUse

Configurar en `~/.claude/settings.json`:

- **Prettier**: Auto-formatear archivos JS/TS después de editar
- **TypeScript check**: Correr `tsc` después de editar archivos `.ts`/`.tsx`
- **console.log warning**: Advertir sobre `console.log` en archivos editados

## Hooks de Stop

- **console.log audit**: Chequear todos los archivos modificados en busca de `console.log` antes de que termine la sesión
