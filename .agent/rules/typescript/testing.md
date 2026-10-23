---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Testing TypeScript/JavaScript

> Este archivo extiende [common/testing.md](../common/testing.md) con contenido específico de TypeScript/JavaScript.

## Testing E2E

Usar **Playwright** como framework de testing E2E para flujos de usuario críticos.

La suite vive en `apps/e2e` (`pnpm e2e`, ver [`docs/E2E.md`](../../../docs/E2E.md)) y se corre en cada review de pasaje. Una pantalla, un flujo o un endpoint nuevos traen su prueba E2E en el mismo cambio; las pruebas importan `test` de `support/test.ts`. No forma parte de `pnpm test`.

## Soporte de agentes

- **e2e-runner** - Especialista en testing E2E con Playwright
