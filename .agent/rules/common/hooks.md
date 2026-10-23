# Sistema de Hooks

## Tipos de hook

- **PreToolUse**: Antes de ejecutar una tool (validación, modificación de parámetros)
- **PostToolUse**: Después de ejecutar una tool (auto-format, checks)
- **Stop**: Cuando termina la sesión (verificación final)

## Permisos de auto-accept

Usar con precaución:
- Habilitar para planes confiables y bien definidos
- Deshabilitar para trabajo exploratorio
- Nunca usar el flag dangerously-skip-permissions
- Configurar `allowedTools` en `~/.claude.json` en su lugar

## Buenas prácticas de TodoWrite

Usar la tool TodoWrite para:
- Trackear el progreso en tareas de múltiples pasos
- Verificar la comprensión de las instrucciones
- Habilitar steering en tiempo real
- Mostrar pasos de implementación granulares

La lista de todos revela:
- Pasos fuera de orden
- Ítems faltantes
- Ítems extra innecesarios
- Granularidad incorrecta
- Requerimientos malinterpretados
