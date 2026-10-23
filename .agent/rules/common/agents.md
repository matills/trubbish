# Orquestación de agentes

## Agentes disponibles

Ubicados en `~/.claude/agents/`:

| Agente | Propósito | Cuándo usarlo |
|-------|---------|-------------|
| planner | Planificación de implementación | Features complejas, refactors |
| architect | Diseño de sistema | Decisiones arquitectónicas |
| tdd-guide | Test-driven development | Features nuevas, bug fixes |
| code-reviewer | Code review | Después de escribir código |
| security-reviewer | Análisis de seguridad | Antes de commits |
| build-error-resolver | Corregir errores de build | Cuando el build falla |
| e2e-runner | Testing E2E | Flujos de usuario críticos |
| refactor-cleaner | Limpieza de dead code | Mantenimiento de código |
| doc-updater | Documentación | Actualizar docs |
| rust-reviewer | Code review de Rust | Proyectos Rust |
| harmonyos-app-resolver | Desarrollo de apps HarmonyOS | Proyectos HarmonyOS/ArkTS |

## Uso inmediato de agentes

Sin necesidad de que el usuario lo pida:
1. Requests de features complejas - Usar el agente **planner**
2. Código recién escrito/modificado - Usar el agente **code-reviewer**
3. Bug fix o feature nueva - Usar el agente **tdd-guide**
4. Decisión arquitectónica - Usar el agente **architect**

## Ejecución paralela de tasks

SIEMPRE usar ejecución paralela de Task para operaciones independientes:

```markdown
# BIEN: Ejecución paralela
Lanzar 3 agentes en paralelo:
1. Agente 1: Análisis de seguridad del módulo de auth
2. Agente 2: Review de performance del sistema de caché
3. Agente 3: Type checking de utilidades

# MAL: Secuencial cuando no hace falta
Primero el agente 1, después el agente 2, después el agente 3
```

## Análisis multi-perspectiva

Para problemas complejos, usar sub-agentes con roles divididos:
- Revisor factual
- Ingeniero senior
- Experto en seguridad
- Revisor de consistencia
- Chequeo de redundancia
