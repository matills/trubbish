---
name: frontend-patterns
description: Frontend development patterns for Vue 3 Composition API, Pinia state management, composables, and performant, accessible UIs.
origin: borrar (adapted from ECC's React-based skill)
---

# Patrones de desarrollo frontend (Vue 3)

Patrones modernos de frontend para Vue 3 Composition API, Pinia, y UIs performantes, acordes a las convenciones de [`rules/vue.md`](../../rules/vue.md) (Atomic Design, `<script setup lang="ts">`, capa de servicios).

## Cuándo activarlo

- Al construir componentes Vue (composición, props, slots, rendering)
- Al manejar estado (`ref`/`reactive`, composables, stores de Pinia)
- Al implementar data fetching vía la capa de servicios (`src/services/`)
- Al optimizar performance (memoization, virtualización, code splitting)
- Al trabajar con forms (validación con Zod, inputs controlados)
- Al manejar routing y navegación con Vue Router
- Al construir patrones de UI accesibles y responsive

## Patrones de componentes

### Composición por sobre herencia (slots)

```vue
<!-- ✅ BIEN: composición de componentes vía slots -->
<!-- BaseCard.vue -->
<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'outlined' }>(), {
  variant: 'default',
})
</script>

<template>
  <div :class="`card card-${variant}`">
    <slot />
  </div>
</template>
```

```vue
<!-- Uso -->
<BaseCard variant="outlined">
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</BaseCard>
```

### Compound Components (provide/inject)

```vue
<!-- Tabs.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'

const props = defineProps<{ defaultTab: string }>()
const activeTab = ref(props.defaultTab)

provide('tabsContext', { activeTab })
</script>

<template>
  <slot />
</template>
```

```vue
<!-- Tab.vue -->
<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{ id: string }>()
const context = inject<{ activeTab: Ref<string> }>('tabsContext')
if (!context) throw new Error('Tab debe usarse dentro de Tabs')
</script>

<template>
  <button :class="{ active: context.activeTab.value === id }" @click="context.activeTab.value = id">
    <slot />
  </button>
</template>
```

```vue
<!-- Uso -->
<Tabs default-tab="overview">
  <Tab id="overview">Overview</Tab>
  <Tab id="details">Details</Tab>
</Tabs>
```

### Scoped Slots (equivalente a Render Props)

```vue
<!-- DataLoader.vue -->
<script setup lang="ts" generic="T">
defineProps<{ url: string }>()
const { data, loading, error } = useQuery<T>(() => fetch(url).then(r => r.json()))
</script>

<template>
  <slot :data="data" :loading="loading" :error="error" />
</template>
```

```vue
<!-- Uso -->
<DataLoader url="/catalog/search">
  <template #default="{ data, loading, error }">
    <BaseSpinner v-if="loading" />
    <ErrorMessage v-else-if="error" :error="error" />
    <ServiceList v-else :items="data" />
  </template>
</DataLoader>
```

## Patrones de Composables

### Composable de manejo de estado

```typescript
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const value = ref(initialValue)
  const toggle = () => { value.value = !value.value }
  return { value, toggle }
}

// Uso
const { value: isOpen, toggle: toggleOpen } = useToggle()
```

### Composable de data fetching async

```typescript
// composables/useQuery.ts
import { ref, watch, type Ref } from 'vue'

interface UseQueryOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: Ref<boolean> | boolean
}

export function useQuery<T>(
  key: Ref<string> | string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>,
) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function refetch() {
    loading.value = true
    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      options?.onSuccess?.(result)
    } catch (err) {
      const e = err as Error
      error.value = e
      options?.onError?.(e)
    } finally {
      loading.value = false
    }
  }

  const keyRef = typeof key === 'string' ? ref(key) : key
  watch(keyRef, refetch, { immediate: options?.enabled !== false })

  return { data, error, loading, refetch }
}

// Uso — la capa de servicios (src/services/) provee el fetcher, nunca fetch() inline
const { data: results, loading, error, refetch } = useQuery(
  'content-search',
  () => contentService.search(query.value),
  {
    onSuccess: data => console.log('Fetched', data.length, 'results'),
    onError: err => console.error('Failed:', err),
  },
)
```

### Composable de Debounce

```typescript
// composables/useDebounce.ts
import { ref, watch, type Ref } from 'vue'

export function useDebounce<T>(source: Ref<T>, delay: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let handle: ReturnType<typeof setTimeout>

  watch(source, value => {
    clearTimeout(handle)
    handle = setTimeout(() => { debounced.value = value }, delay)
  })

  return debounced
}

// Uso
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)

watch(debouncedQuery, query => {
  if (query) performSearch(query)
})
```

## Patrones de manejo de estado (Pinia)

### Setup Store con acciones agrupadas

```typescript
// stores/accounts.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { accountsService } from '@/services/accounts.service'
import type { TrackedAccount } from '@/types/accounts'

export const useAccountsStore = defineStore('accounts', () => {
  const entries = ref<TrackedAccount[]>([])
  const loading = ref(false)

  async function fetchEntries(userId: string) {
    loading.value = true
    try {
      entries.value = await accountsService.findByUser(userId)
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(accountId: string, status: TrackedAccount['status']) {
    // Mutación agrupada: actualiza el server y el estado local en una sola acción
    const updated = await accountsService.updateStatus(accountId, status)
    const index = entries.value.findIndex(e => e.id === accountId)
    if (index !== -1) entries.value[index] = updated
  }

  return { entries, loading, fetchEntries, updateStatus }
})
```

```typescript
// ✅ Correcto — leer estado de un store con storeToRefs (mantiene la reactividad)
const { entries, loading } = storeToRefs(useAccountsStore())

// ❌ Incorrecto — pierde la reactividad
const { entries } = useAccountsStore()
```

## Optimización de performance

### Memoization

```typescript
// ✅ computed para derivaciones costosas
const sortedContent = computed(() =>
  [...content.value].sort((a, b) => b.popularity - a.popularity),
)

// ✅ shallowRef para estructuras grandes que se reemplazan enteras, no mutan
const searchResults = shallowRef<ContentItem[]>([])
```

### Code Splitting y Lazy Loading

```typescript
import { defineAsyncComponent } from 'vue'

// ✅ Lazy load de componentes pesados
const StatsChart = defineAsyncComponent(() => import('./StatsChart.vue'))
const ThreeJsBackground = defineAsyncComponent(() => import('./ThreeJsBackground.vue'))
```

```typescript
// router/index.ts — lazy loading de rutas
{
  path: '/stats',
  component: () => import('@/pages/StatsPage.vue'),
}
```

### Virtualización para listas largas

```vue
<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { ref } from 'vue'

const props = defineProps<{ items: ContentItem[] }>()
const parentRef = ref<HTMLDivElement | null>(null)

const virtualizer = useVirtualizer({
  count: props.items.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 100,
  overscan: 5,
})
</script>

<template>
  <div ref="parentRef" style="height: 600px; overflow: auto">
    <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
      <ContentCard
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.index"
        :content="items[row.index]"
        :style="{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${row.start}px)` }"
      />
    </div>
  </div>
</template>
```

## Patrones de manejo de forms

### Form controlado con validación Zod

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { listService } from '@/services/list.service'

const createListSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  description: z.string().trim().min(1, 'La descripción es requerida'),
})

const formData = ref({ name: '', description: '' })
const errors = ref<Partial<Record<keyof typeof formData.value, string>>>({})

function validate(): boolean {
  const result = createListSchema.safeParse(formData.value)
  errors.value = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.value[issue.path[0] as keyof typeof formData.value] = issue.message
    }
  }

  return result.success
}

async function handleSubmit() {
  if (!validate()) return

  try {
    await listService.create(formData.value)
    // Manejo de éxito
  } catch (error) {
    // Manejo de error
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <BaseInput v-model="formData.name" placeholder="List name" />
    <span v-if="errors.name" class="error">{{ errors.name }}</span>

    <!-- Otros campos -->

    <BaseButton type="submit">Create List</BaseButton>
  </form>
</template>
```

## Manejo de errores (onErrorCaptured)

Vue no tiene un class-based Error Boundary — el equivalente es el hook `onErrorCaptured` en un componente ancestro:

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  console.error('Error boundary caught:', err)
  return false // detiene la propagación
})
</script>

<template>
  <div v-if="error" class="error-fallback">
    <h2>Something went wrong</h2>
    <p>{{ error.message }}</p>
    <BaseButton @click="error = null">Try again</BaseButton>
  </div>
  <slot v-else />
</template>
```

```vue
<!-- Uso -->
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Patrones de animación

### Transiciones nativas de Vue

```vue
<!-- ✅ Animaciones de lista -->
<template>
  <TransitionGroup name="list" tag="div">
    <ContentCard v-for="item in content" :key="item.id" :content="item" />
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
```

```vue
<!-- ✅ Animaciones de modal -->
<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click="onClose">
      <div class="modal-content" @click.stop>
        <slot />
      </div>
    </div>
  </Transition>
</template>
```

## Patrones de accesibilidad

### Navegación por teclado

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ options: string[] }>()
const emit = defineEmits<{ select: [value: string] }>()

const isOpen = ref(false)
const activeIndex = ref(0)

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      emit('select', props.options[activeIndex.value])
      isOpen.value = false
      break
    case 'Escape':
      isOpen.value = false
      break
  }
}
</script>

<template>
  <div role="combobox" :aria-expanded="isOpen" aria-haspopup="listbox" @keydown="handleKeydown">
    <!-- Implementación del dropdown -->
  </div>
</template>
```

### Manejo de foco (modal)

```vue
<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const modalRef = useTemplateRef<HTMLDivElement>('modal')
let previousFocus: HTMLElement | null = null

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    previousFocus = document.activeElement as HTMLElement
    modalRef.value?.focus()
  } else {
    previousFocus?.focus()
  }
})
</script>

<template>
  <div
    v-if="isOpen"
    ref="modal"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    @keydown.escape="emit('close')"
  >
    <slot />
  </div>
</template>
```

**Recordá**: los patrones modernos de frontend habilitan UIs mantenibles y performantes. Elegí los patrones que encajen con la complejidad de tu componente, y seguí siempre la capa de Atomic Design y las reglas de `rules/vue.md`.
