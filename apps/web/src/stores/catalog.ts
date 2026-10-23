import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CatalogEntry, Category } from '@trubbish/shared'
import { catalogService } from '@/services'

export const useCatalogStore = defineStore('catalog', () => {
  const services = ref<CatalogEntry[]>([])
  const loaded = ref(false)

  async function load(): Promise<void> {
    if (loaded.value) return
    services.value = await catalogService.list()
    loaded.value = true
  }

  const byCategory = computed(() => {
    const map = new Map<Category, CatalogEntry[]>()
    for (const s of services.value) map.set(s.category, [...(map.get(s.category) ?? []), s])
    return map
  })

  /** Busca por dominio (o subdominio) o por nombre exacto, para mostrar coincidencias antes de importar. */
  function match(value: string): CatalogEntry | null {
    const v = value.trim().toLowerCase()
    if (!v) return null
    return (
      services.value.find((s) => v === s.domain || v.endsWith(`.${s.domain}`)) ??
      services.value.find((s) => s.name.toLowerCase() === v || s.slug === v) ??
      null
    )
  }

  return { services, loaded, byCategory, load, match }
})
