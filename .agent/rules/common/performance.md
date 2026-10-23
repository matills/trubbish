# Optimización de performance

## Estrategia de selección de modelo

**Haiku 4.5** (90% de la capacidad de Sonnet, 3x de ahorro en costo):
- Agentes livianos con invocación frecuente
- Pair programming y generación de código
- Agentes worker en sistemas multi-agente

**Sonnet 4.6** (Mejor modelo para coding):
- Trabajo de desarrollo principal
- Orquestación de flujos multi-agente
- Tareas de coding complejas

**Opus 4.5** (Razonamiento más profundo):
- Decisiones arquitectónicas complejas
- Requerimientos de razonamiento máximo
- Tareas de research y análisis

## Manejo de la ventana de contexto

Evitar el último 20% de la ventana de contexto para:
- Refactors a gran escala
- Implementación de features que abarcan múltiples archivos
- Debugging de interacciones complejas

Tareas con menor sensibilidad al contexto:
- Edits de un solo archivo
- Creación de utilidades independientes
- Actualización de documentación
- Bug fixes simples

## Extended Thinking + Plan Mode

Extended thinking está habilitado por defecto, reservando hasta 31.999 tokens para razonamiento interno.

Controlar extended thinking vía:
- **Toggle**: Option+T (macOS) / Alt+T (Windows/Linux)
- **Config**: Setear `alwaysThinkingEnabled` en `~/.claude/settings.json`
- **Tope de budget**: `export MAX_THINKING_TOKENS=10000`
- **Modo verbose**: Ctrl+O para ver el output del thinking

Para tareas complejas que requieren razonamiento profundo:
1. Asegurarse de que extended thinking esté habilitado (on por defecto)
2. Habilitar **Plan Mode** para un approach estructurado
3. Usar múltiples rondas de crítica para un análisis exhaustivo
4. Usar sub-agentes con roles divididos para perspectivas diversas

## Troubleshooting de build

Si el build falla:
1. Usar el agente **build-error-resolver**
2. Analizar los mensajes de error
3. Corregir incrementalmente
4. Verificar después de cada fix
