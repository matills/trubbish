---
name: search-first
description: Research-before-coding workflow. Search for existing tools, libraries, and patterns before writing custom code. Invokes the researcher agent.
origin: ECC
---

# /search-first — Investigar antes de codear

Sistematiza el flujo de "buscar soluciones existentes antes de implementar".

## Trigger

Usar este skill cuando:
- Se empieza una feature nueva que probablemente ya tiene soluciones existentes
- Se agrega una dependencia o integración
- El usuario pide "agregar funcionalidad X" y estás por escribir código
- Antes de crear una utilidad, helper, o abstracción nueva

## Flujo de trabajo

```
┌─────────────────────────────────────────────┐
│  0. PREFLIGHT DE DISPONIBILIDAD DE TOOLS    │
│     Chequear los canales de búsqueda antes  │
│     de depender de ellos; reportar          │
│     honestamente los canales salteados       │
├─────────────────────────────────────────────┤
│  1. ANÁLISIS DE NECESIDAD                   │
│     Definir qué funcionalidad hace falta     │
│     Identificar restricciones de lenguaje/   │
│     framework                                │
├─────────────────────────────────────────────┤
│  2. BÚSQUEDA EN PARALELO (agente researcher)│
│     ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│     │  npm /   │ │  MCP /   │ │  GitHub / │  │
│     │  PyPI    │ │  Skills  │ │  Web      │  │
│     └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────┤
│  3. EVALUAR                                 │
│     Puntuar candidatos (funcionalidad,      │
│     mantenimiento, comunidad, docs,         │
│     licencia, deps)                         │
├─────────────────────────────────────────────┤
│  4. DECIDIR                                 │
│     ┌─────────┐  ┌──────────┐  ┌─────────┐  │
│     │ Adoptar │  │ Extender │  │Construir│  │
│     │ tal cual│  │  /Wrap   │  │ custom  │  │
│     └─────────┘  └──────────┘  └─────────┘  │
├─────────────────────────────────────────────┤
│  5. IMPLEMENTAR                             │
│     Instalar paquete / Configurar MCP /     │
│     Escribir código custom mínimo           │
└─────────────────────────────────────────────┘
```

## Matriz de decisión

| Señal | Acción |
|--------|--------|
| Match exacto, bien mantenido, MIT/Apache | **Adoptar** — instalar y usar directamente |
| Match parcial, buena base | **Extender** — instalar + escribir un wrapper fino |
| Múltiples matches débiles | **Combinar** — combinar 2-3 paquetes chicos |
| Nada adecuado encontrado | **Construir** — escribir custom, pero informado por la investigación |

## Cómo usarlo

### Paso 0: Preflight de disponibilidad de tools

Esto es guía para el agente, no un script de setup ejecutable. Chequear solo
los canales relevantes para la tarea y el proyecto que tenés adelante.

| Canal | Chequeo | Si falta |
|---------|-------|------------|
| Búsqueda en el repositorio | `rg --files` y queries `rg` puntuales | Indicar que solo se inspeccionaron los archivos visibles |
| Registry de paquetes | `npm --version`, `python -m pip --version`, o el package manager del proyecto | Usar búsqueda web/docs y evitar afirmar cobertura del registry |
| GitHub CLI | `gh auth status` | Usar solo web pública o historial de git local |
| Tools de MCP/docs | Lista de tools disponibles o config local de MCP | Volver a docs oficiales/búsqueda web |
| Directorio de skills | `ls ~/.claude/skills ~/.codex/skills` donde aplique | Decir que no había catálogo de skills local disponible |

### Modo rápido (inline)

Antes de escribir una utilidad o agregar funcionalidad, repasar mentalmente:

0. ¿Esto ya existe en el repo? → primero `rg` en los módulos/tests relevantes
1. ¿Es un problema común? → Buscar en npm/PyPI
2. ¿Hay un MCP para esto? → Chequear `~/.claude/settings.json` y buscar
3. ¿Hay un skill para esto? → Chequear `~/.claude/skills/`
4. ¿Hay una implementación/template en GitHub? → Correr búsqueda de código en GitHub por OSS mantenido antes de escribir código net-new

### Modo completo (agente)

Para funcionalidad no trivial, lanzar el agente researcher:

```
Agent(subagent_type="general-purpose", prompt="
  Investigar tools existentes para: [DESCRIPCIÓN]
  Lenguaje/framework: [LANG]
  Restricciones: [CUALQUIERA]

  Buscar en: npm/PyPI, servidores MCP, skills de Claude Code, GitHub
  Devolver: comparación estructurada con recomendación
")
```

Docs más viejas de Claude Code pueden llamar a esto `Task(...)`; usar el
nombre de tool de agent/subagent actual que expone el harness activo.

## Atajos de búsqueda por categoría

### Tooling de desarrollo
- Linting → `eslint`, `ruff`, `textlint`, `markdownlint`
- Formatting → `prettier`, `black`, `gofmt`
- Testing → `jest`, `pytest`, `go test`
- Pre-commit → `husky`, `lint-staged`, `pre-commit`

### Integración de IA/LLM
- Claude SDK → Context7 para la doc más reciente
- Manejo de prompts → Chequear servidores MCP
- Procesamiento de documentos → `unstructured`, `pdfplumber`, `mammoth`

### Datos y APIs
- Clientes HTTP → `httpx` (Python), `ky`/`undici` (Node)
- Validación → `zod` (TS), `pydantic` (Python)
- Base de datos → Chequear servidores MCP primero

### Contenido y publicación
- Procesamiento de Markdown → `remark`, `unified`, `markdown-it`
- Optimización de imágenes → `sharp`, `imagemin`

## Puntos de integración

### Con el agente planner
El planner debería invocar al researcher antes de la Fase 1 (Revisión de arquitectura):
- El researcher identifica las tools disponibles
- El planner las incorpora al plan de implementación
- Evita "reinventar la rueda" en el plan

### Con el agente architect
El architect debería consultar al researcher para:
- Decisiones de stack tecnológico
- Descubrimiento de patrones de integración
- Arquitecturas de referencia existentes

### Con el skill iterative-retrieval
Combinar para descubrimiento progresivo:
- Ciclo 1: búsqueda amplia (npm, PyPI, MCP)
- Ciclo 2: evaluar los candidatos top en detalle
- Ciclo 3: testear compatibilidad con las restricciones del proyecto

## Ejemplos

### Ejemplo 1: "Agregar chequeo de links rotos"
```
Necesidad: chequear archivos markdown por links rotos
Búsqueda: npm "markdown dead link checker"
Encontrado: textlint-rule-no-dead-link (score: 9/10)
Acción: ADOPTAR — npm install textlint-rule-no-dead-link
Resultado: cero código custom, solución battle-tested
```

### Ejemplo 2: "Agregar wrapper de cliente HTTP"
```
Necesidad: cliente HTTP resiliente con retries y manejo de timeout
Búsqueda: npm "http client retry", PyPI "httpx retry"
Encontrado: got (Node) con plugin de retry, httpx (Python) con retry incorporado
Acción: ADOPTAR — usar got/httpx directamente con config de retry
Resultado: cero código custom, librerías probadas en producción
```

### Ejemplo 3: "Agregar linter de archivos de config"
```
Necesidad: validar archivos de config del proyecto contra un esquema
Búsqueda: npm "config linter schema", "json schema validator cli"
Encontrado: ajv-cli (score: 8/10)
Acción: ADOPTAR + EXTENDER — instalar ajv-cli, escribir el esquema específico del proyecto
Resultado: 1 paquete + 1 archivo de esquema, sin lógica de validación custom
```

## Anti-patrones

- **Saltar directo al código**: escribir una utilidad sin chequear si ya existe una
- **Ignorar MCP**: no chequear si un servidor MCP ya provee la capacidad
- **Salteo silencioso**: reportar "no se encontró nada" cuando un canal de búsqueda no estaba disponible
- **Sobre-customizar**: envolver una librería tan pesadamente que pierde sus beneficios
- **Dependency bloat**: instalar un paquete enorme para una sola feature chica
