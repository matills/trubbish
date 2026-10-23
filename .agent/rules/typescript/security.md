---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Seguridad TypeScript/JavaScript

> Este archivo extiende [common/security.md](../common/security.md) con contenido específico de TypeScript/JavaScript.

## Manejo de secrets

```typescript
// NUNCA: secrets hardcodeados
const apiKey = "sk-proj-xxxxx"

// SIEMPRE: variables de entorno
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## Soporte de agentes

- Usar el skill **security-reviewer** para auditorías de seguridad exhaustivas
