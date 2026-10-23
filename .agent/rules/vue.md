# AGENT.md — Borrar mi vida digital Frontend (Vue 3)

Lineamientos de comportamiento para desarrollo asistido por IA en este proyecto.
**Tradeoff:** Estos lineamientos priorizan la cautela por sobre la velocidad. Para tareas triviales, usar criterio.

---

## 1. Pensar antes de codear

No asumas. No ocultes la confusión. Hacé explícitos los tradeoffs.

Antes de implementar:

- Enunciá tus supuestos explícitamente. Si hay incertidumbre, preguntá.
- Si existen múltiples interpretaciones, presentalas — no elijas en silencio.
- Si existe un approach más simple, decilo. Cuestioná cuando corresponda.
- Si algo no está claro, parate. Nombrá qué es confuso. Preguntá.

---

## 2. Simplicidad primero

El código mínimo que resuelve el problema. Nada especulativo.

- Sin features más allá de lo pedido.
- Sin abstracciones para código de un solo uso.
- Sin "flexibilidad" o "configurabilidad" que no se pidió.
- Sin manejo de errores para escenarios imposibles.
- Si escribís 200 líneas y podrían ser 50, reescribilo.

Preguntate: *"¿Un ingeniero senior diría que esto está sobrecomplicado?"* Si la respuesta es sí, simplificá.

---

## 3. Cambios quirúrgicos

Tocá solo lo que sea necesario. Limpiá solo tu propio desorden.

Al editar código existente:

- No "mejores" código, comentarios o formato adyacente.
- No refactorices cosas que no están rotas.
- Igualá el estilo existente, aunque lo harías distinto.
- Si notás dead code no relacionado, mencionalo — no lo borres.

Cuando tus cambios generan huérfanos:

- Eliminá imports/variables/funciones que **tus** cambios dejaron sin uso.
- No elimines dead code preexistente salvo que se pida.

**El test:** cada línea cambiada debe poder trazarse directo al pedido del usuario.

---

## 4. Ejecución orientada a objetivos

Definí criterios de éxito. Iterá hasta verificar.

Transformá tareas en objetivos verificables:

- `"Agregar validación"` → `"Escribir tests para inputs inválidos, después hacer que pasen"`
- `"Arreglar el bug"` → `"Escribir un test que lo reproduzca, después hacer que pase"`
- `"Refactorizar X"` → `"Asegurar que los tests pasen antes y después"`

Para tareas de múltiples pasos, enunciá un plan breve:

```
1. [Paso] → verificar: [check]
2. [Paso] → verificar: [check]
3. [Paso] → verificar: [check]
```

Criterios de éxito fuertes te permiten iterar de forma independiente. Criterios débiles ("que funcione") requieren aclaraciones constantes.

---

## 5. Lineamientos de componentes Vue

### Estilo

- Tokens, colores, bordes, sombras y tipografía: seguir [`docs/DESIGN.md`](../../docs/DESIGN.md) (neobrutalismo oscuro, sin `dark:`, sin `rounded-*`, sin hex literales).
- Siempre usar **Composition API** con `<script setup>`.
- Siempre usar **TypeScript** (`<script setup lang="ts">`).
- Las props deben tiparse explícitamente — nunca usar `defineProps({})` sin tipar.
- Los emits deben declararse con `defineEmits<{...}>()`.

```vue
<!-- ✅ Correcto -->
<script setup lang="ts">
const props = defineProps<{
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: [value: string]
}>()
</script>

<!-- ❌ Incorrecto -->
<script setup>
const props = defineProps(['label', 'disabled'])
</script>
```

### Orden de estructura del archivo de componente

```vue
<script setup lang="ts">
// 1. imports
// 2. props y emits
// 3. store / composables
// 4. estado reactivo
// 5. computed
// 6. funciones
// 7. lifecycle hooks
</script>

<template>
  <!-- markup -->
</template>

<style scoped>
/* estilos */
</style>
```

---

## 6. Atomic Design

Este proyecto sigue **Atomic Design** de forma estricta. Cada componente pertenece exactamente a una capa.

### Capas

| Capa | Descripción | Ejemplos |
|---|---|---|
| **Atom** | Unidad de UI más pequeña e indivisible. Sin lógica de negocio. Sin dependencias externas más allá de los design tokens. | `BaseButton`, `BaseInput`, `BaseTag`, `BaseAvatar`, `BaseIcon`, `BaseBadge` |
| **Molecule** | Combinación de atoms que forman una unidad de UI autocontenida. | `SearchBar` (BaseInput + BaseButton), `RatingInput` (BaseIcon × N), `FormField` (BaseLabel + BaseInput + BaseHint) |
| **Organism** | Sección de UI compleja compuesta de molecules y/o atoms. Puede conectarse a stores o composables. | `AccountCard`, `ServiceRow`, `ScanSummary`, `RequestLetter` |
| **Template** | Skeleton de layout de página. Define slots y grid. Sin datos reales — usa solo props/slots. | `DefaultLayout`, `SidebarLayout`, `AuthLayout` |
| **Page** | Conecta un template con datos reales (store, ruta, API). Uno por ruta. | `HomePage`, `ContentDetailPage`, `ProfilePage` |

### Estructura de carpetas

```
src/
├── components/
│   ├── atoms/
│   │   ├── BaseButton/
│   │   │   ├── BaseButton.vue
│   │   │   └── BaseButton.test.ts
│   │   ├── BaseInput/
│   │   ├── BaseTag/
│   │   └── ...
│   ├── molecules/
│   │   ├── SearchBar/
│   │   ├── FormField/
│   │   └── ...
│   └── organisms/
│       ├── ContentCard/
│       ├── ReviewBlock/
│       └── ...
├── layouts/              # Templates
│   ├── DefaultLayout.vue
│   └── AuthLayout.vue
├── pages/                # Pages (una por ruta)
│   ├── HomePage.vue
│   └── ...
├── composables/          # Lógica compartida (patrón useX)
├── stores/               # Pinia stores (uno por dominio)
├── services/             # Capa de API (uno por módulo)
├── types/                # Types/interfaces globales de TypeScript
├── router/
├── assets/
└── main.ts
```

### Reglas

**Antes de crear cualquier componente:**

1. Buscar en `src/components/` un componente existente que cubra la necesidad.
2. Verificar si un atom puede extenderse vía props en vez de crear un componente nuevo.
3. Solo crear un componente nuevo si ninguno existente encaja.

**Reglas de composición por capa:**

- **Atom** → compuesto solo de elementos HTML y design tokens. Nunca importa otro componente.
- **Molecule** → **debe** estar compuesto de atoms. Nunca contiene elementos de formulario HTML crudos directamente.
- **Organism** → compuesto de molecules y/o atoms. Puede usar composables y stores.
- **Template** → solo layout. Sin data fetching. Sin acceso a stores.
- **Page** → la única capa habilitada para hacer fetch de datos y conectarse al router directamente.

**Convenciones de nombres:**

- Atoms: prefijo `Base` → `BaseButton`, `BaseInput`, `BaseModal`
- Molecules: nombre descriptivo → `SearchBar`, `RatingInput`, `ContentListItem`
- Organisms: nombre scoped a la feature → `ContentCard`, `CollabListPanel`
- Templates: sufijo `Layout` → `DefaultLayout`, `AuthLayout`
- Pages: sufijo `Page` → `ProfilePage`, `ContentDetailPage`

**Ejemplos de violación:**

```vue
<!-- ❌ Molecule usando <input> crudo en vez de BaseInput -->
<template>
  <div class="search-bar">
    <input type="text" v-model="query" /> <!-- Incorrecto: debería ser <BaseInput> -->
    <BaseButton>Search</BaseButton>
  </div>
</template>

<!-- ✅ Correcto -->
<template>
  <div class="search-bar">
    <BaseInput v-model="query" placeholder="Search..." />
    <BaseButton>Search</BaseButton>
  </div>
</template>
```

```vue
<!-- ❌ Atom haciendo fetch de datos desde un store -->
<script setup lang="ts">
import { useUserStore } from '@/stores/user' // Incorrecto: los atoms son stateless
</script>

<!-- ✅ Correcto: recibir datos vía props -->
<script setup lang="ts">
defineProps<{ label: string }>()
</script>
```

---

## 7. Manejo de estado (Pinia)

- Un store por dominio: `useAuthStore`, `useAccountsStore`, `useCatalogStore`, etc.
- Los stores manejan el estado del server + el estado de UI local de su dominio.
- Los componentes nunca llaman servicios de API directamente — siempre pasan por un store o composable.
- Usar `storeToRefs()` para destructurar estado reactivo de los stores.

```ts
// ✅ Correcto
const { user, isLoading } = storeToRefs(useAuthStore())

// ❌ Incorrecto — pierde la reactividad
const { user } = useAuthStore()
```

---

## 8. Capa de API

- Todas las llamadas HTTP viven en `src/services/`, nunca inline en componentes o stores.
- Un archivo de servicio por módulo del backend: `catalog.service.ts`, `accounts.service.ts`, etc.
- Los servicios devuelven respuestas tipadas — nada de `any`.

```ts
// src/services/catalog.service.ts
export const catalogService = {
  search: (query: string): Promise<CatalogService[]> =>
    api.get('/catalog/search', { params: { q: query } }),
}
```

---

## 9. Composables

- Usar composables (`useX`) para extraer lógica reutilizable de los componentes.
- Un composable debería hacer una sola cosa bien.
- Si un composable solo se usa en un componente, mantenelo en el componente salvo que sea lo suficientemente complejo para testearlo de forma aislada.

---

## 10. Checklist antes de entregar un componente

- [ ] Se buscó un componente existente antes de crear uno nuevo
- [ ] Se cumplió el checklist de `docs/DESIGN.md` (tokens, bordes 3px, sombra sólida, sin `dark:`)
- [ ] Se asignó la capa de Atomic Design correcta
- [ ] Las molecules están compuestas enteramente de atoms
- [ ] Props y emits totalmente tipados
- [ ] Sin acceso a stores en atoms
- [ ] Sin llamadas directas a la API en componentes
- [ ] Se usa `<script setup lang="ts">`
- [ ] El archivo está en la carpeta correcta con el nombre correspondiente
