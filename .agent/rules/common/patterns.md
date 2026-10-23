# Patrones comunes

## Proyectos skeleton

Al implementar funcionalidad nueva:
1. Buscar proyectos skeleton battle-tested
2. Usar agentes en paralelo para evaluar opciones:
   - Evaluación de seguridad
   - Análisis de extensibilidad
   - Scoring de relevancia
   - Plan de implementación
3. Clonar la mejor opción como base
4. Iterar dentro de la estructura probada

## Design Patterns

### Repository Pattern

Encapsular el acceso a datos detrás de una interfaz consistente:
- Definir operaciones estándar: findAll, findById, create, update, delete
- Las implementaciones concretas manejan los detalles de almacenamiento (base de datos, API, archivo, etc.)
- La lógica de negocio depende de la interfaz abstracta, no del mecanismo de almacenamiento
- Habilita cambiar de fuente de datos fácilmente y simplifica el testing con mocks

### Formato de respuesta de API

Usar un envelope consistente para todas las respuestas de la API:
- Incluir un indicador de success/status
- Incluir el payload de datos (nullable en error)
- Incluir un campo de mensaje de error (nullable en success)
- Incluir metadata para respuestas paginadas (total, page, limit)
