---
name: verification-loop
description: "A comprehensive verification system for Claude Code sessions."
origin: ECC
---

# Skill Verification Loop

Un sistema de verificación exhaustivo para sesiones de Claude Code.

## Cuándo usarlo

Invocar este skill:
- Después de completar una feature o un cambio de código significativo
- Antes de crear un PR
- Cuando querés asegurarte de que los quality gates pasen
- Después de un refactor

## Fases de verificación

### Fase 1: Verificación de build
```bash
# Chequear si el proyecto buildea
npm run build 2>&1 | tail -20
# O
pnpm build 2>&1 | tail -20
```

Si el build falla, PARAR y corregir antes de seguir.

### Fase 2: Type Check
```bash
# Proyectos TypeScript
npx tsc --noEmit 2>&1 | head -30

# Proyectos Python
pyright . 2>&1 | head -30
```

Reportar todos los errores de tipos. Corregir los críticos antes de seguir.

### Fase 3: Lint Check
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### Fase 4: Test Suite
```bash
# Correr tests con cobertura
npm run test -- --coverage 2>&1 | tail -50

# Chequear el umbral de cobertura
# Objetivo: 80% mínimo
```

Reportar:
- Tests totales: X
- Pasaron: X
- Fallaron: X
- Cobertura: X%

### Fase 5: Escaneo de seguridad
```bash
# Chequear secrets
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# Chequear console.log
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### Fase 6: Revisión del diff
```bash
# Mostrar qué cambió
git diff --stat
git diff HEAD~1 --name-only
```

Revisar cada archivo cambiado por:
- Cambios no intencionales
- Falta manejo de errores
- Edge cases potenciales

## Formato de output

Después de correr todas las fases, producir un reporte de verificación:

```
REPORTE DE VERIFICACIÓN
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errores)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y pasaron, Z% cobertura)
Seguridad: [PASS/FAIL] (X issues)
Diff:      [X archivos cambiados]

General:   [LISTO/NO LISTO] para PR

Issues a corregir:
1. ...
2. ...
```

## Modo continuo

Para sesiones largas, correr la verificación cada 15 minutos o después de cambios mayores:

```markdown
Poner un checkpoint mental:
- Después de completar cada función
- Después de terminar un componente
- Antes de pasar a la siguiente tarea

Correr: /verify
```

## Integración con Hooks

Este skill complementa los hooks de PostToolUse pero provee una verificación
más profunda. Los hooks detectan issues de inmediato; este skill provee una
revisión exhaustiva.
