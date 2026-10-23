# Estilo de código

## Inmutabilidad (CRÍTICO)

SIEMPRE crear objetos nuevos, NUNCA mutar los existentes:

```
// Pseudocódigo
INCORRECTO: modify(original, field, value) → cambia el original in-place
CORRECTO:   update(original, field, value) → devuelve una copia nueva con el cambio
```

Motivo: los datos inmutables evitan efectos secundarios ocultos, facilitan el debugging y habilitan concurrencia segura.

## Principios centrales

### KISS (Keep It Simple)

- Preferir la solución más simple que realmente funcione
- Evitar la optimización prematura
- Optimizar por claridad, no por ingenio

### DRY (Don't Repeat Yourself)

- Extraer lógica repetida en funciones o utilidades compartidas
- Evitar el copy-paste que hace divergir la implementación
- Introducir abstracciones cuando la repetición es real, no especulativa

### Buscar antes de crear (CRÍTICO)

Antes de definir cualquier constante, tipo, helper, utilidad o componente, **siempre buscar primero en el codebase**.

```
INCORRECTO: definir TYPE_LABELS localmente en cada componente
CORRECTO:   verificar si TYPE_LABELS ya existe → si no existe, crearlo en el archivo compartido canónico
```

**Checklist obligatorio antes de crear algo nuevo:**

| Qué querés crear | Dónde buscar primero |
|---|---|
| Type / interface | `src/types/`, `dto/*.ts` |
| Constante / record / map | `src/types/`, `src/utils/`, `src/constants/` |
| Helper / función utilitaria | `src/utils/`, `src/composables/` |
| Componente UI | `src/components/atoms/`, `molecules/`, `organisms/` |
| Método de API | Archivos de servicio existentes en `src/services/` |
| Acción de store | Archivos de store existentes en `src/stores/` |

**Reglas:**
- Si ya existe → importalo. Nunca lo copies y pegues.
- Si casi encaja → extendelo o generalizalo, no lo bifurques.
- Si realmente no existe → creá en la **ubicación compartida canónica**, nunca inline en un solo archivo salvo que sea genuinamente privado a ese archivo.
- Una constante usada en más de un archivo **debe** vivir en un archivo compartido.
- Un tipo usado en más de un archivo **debe** vivir en el `types/` correspondiente.

### YAGNI (You Aren't Gonna Need It)

- No construir features o abstracciones antes de necesitarlas
- Evitar la generalidad especulativa
- Empezar simple y refactorizar cuando la presión sea real

## Organización de archivos

MUCHOS ARCHIVOS CHICOS > POCOS ARCHIVOS GRANDES:
- Alta cohesión, bajo acoplamiento
- 200-400 líneas típico, 800 máximo
- Extraer utilidades de módulos grandes
- Organizar por feature/dominio, no por tipo

## Manejo de errores

SIEMPRE manejar errores de forma exhaustiva:
- Manejar errores explícitamente en cada nivel
- Dar mensajes de error entendibles por el usuario en código de UI
- Loguear contexto de error detallado del lado del servidor
- Nunca tragarse errores en silencio

## Validación de inputs

SIEMPRE validar en los límites del sistema:
- Validar todo input del usuario antes de procesarlo
- Usar validación basada en esquemas donde esté disponible
- Fallar rápido con mensajes de error claros
- Nunca confiar en datos externos (respuestas de API, input de usuario, contenido de archivos)

## Convenciones de nombres

- Variables y funciones: `camelCase` con nombres descriptivos
- Booleanos: preferir prefijos `is`, `has`, `should` o `can`
- Interfaces, tipos y componentes: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Custom hooks: `camelCase` con prefijo `use`

## Code smells a evitar

### Anidamiento profundo

Preferir early returns por sobre condicionales anidados cuando la lógica empieza a apilarse.

### Números mágicos

Usar constantes con nombre para umbrales, delays y límites con significado.

### Funciones largas

Dividir funciones grandes en piezas enfocadas con responsabilidades claras.

## Checklist de calidad de código

Antes de dar el trabajo por terminado:
- [ ] El código es legible y está bien nombrado
- [ ] Las funciones son chicas (<50 líneas)
- [ ] Los archivos están enfocados (<800 líneas)
- [ ] No hay anidamiento profundo (>4 niveles)
- [ ] Manejo de errores adecuado
- [ ] Sin valores hardcodeados (usar constantes o config)
- [ ] Sin mutación (patrones inmutables)
- [ ] Sin type/constante/helper definido localmente que ya existe en otro lado
- [ ] Toda constante usada en >1 archivo vive en una ubicación compartida
- [ ] Todo tipo nuevo vive en el `types/` correspondiente, no inline
