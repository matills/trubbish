<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AccountSource, Category, type CatalogEntry } from '@trubbish/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import ServiceRow from '@/components/molecules/ServiceRow.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useCatalogStore } from '@/stores/catalog'
import { CATEGORY_LABEL } from '@/utils/labels'

const accounts = useAccountsStore()
const { services } = storeToRefs(useCatalogStore())
const { domains } = storeToRefs(accounts)

const query = ref('')
const category = ref<Category | 'ALL'>('ALL')
const busy = ref<number | null>(null)
const manualDomain = ref('')
const manualBusy = ref(false)
const message = ref<string | null>(null)

const categories = computed(() => ['ALL' as const, ...Object.values(Category).filter((c) => services.value.some((s) => s.category === c))])
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return services.value.filter(
    (s) => (category.value === 'ALL' || s.category === category.value) && (!q || s.name.toLowerCase().includes(q) || s.domain.includes(q)),
  )
})

async function add(service: CatalogEntry) {
  busy.value = service.id
  message.value = null
  try {
    await accounts.create({ serviceId: service.id, source: AccountSource.CATALOG })
  } catch (err) {
    message.value = errorMessage(err)
  } finally {
    busy.value = null
  }
}

async function addManual() {
  if (!manualDomain.value.trim()) return
  manualBusy.value = true
  message.value = null
  try {
    const account = await accounts.create({ domain: manualDomain.value, source: AccountSource.MANUAL })
    message.value = `${account.name} entró al expediente.`
    manualDomain.value = ''
  } catch (err) {
    message.value = errorMessage(err)
  } finally {
    manualBusy.value = false
  }
}
</script>

<template>
  <div class="picker">
    <div class="picker__filters">
      <BaseInput v-model="query" label="Buscar en el catálogo" placeholder="Netflix, Despegar, Steam…" />
      <div class="chips" role="group" aria-label="Rubro">
        <button
          v-for="c in categories"
          :key="c"
          type="button"
          class="chip"
          :class="{ 'is-on': category === c }"
          :aria-pressed="category === c"
          @click="category = c"
        >
          {{ c === 'ALL' ? 'Todos' : CATEGORY_LABEL[c] }}
        </button>
      </div>
    </div>

    <p v-if="message" class="picker__msg mono" role="status">{{ message }}</p>

    <ul class="picker__list">
      <ServiceRow
        v-for="s in results"
        :key="s.id"
        :service="s"
        :added="domains.has(s.domain)"
        :busy="busy === s.id"
        @add="add(s)"
      />
    </ul>
    <p v-if="results.length === 0" class="mono picker__none">Nada en el catálogo con «{{ query }}». Agregalo a mano abajo.</p>

    <form class="picker__manual" @submit.prevent="addManual">
      <BaseInput v-model="manualDomain" label="¿No está? Agregalo por su dirección" placeholder="sitio-olvidado.com" mono />
      <BaseButton type="submit" :loading="manualBusy">Agregar</BaseButton>
    </form>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  gap: 20px;
}

.picker__filters {
  display: grid;
  gap: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 10px;
  border: var(--border);
  background: var(--paper);
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  cursor: pointer;
}

.chip.is-on,
.chip:hover {
  background: var(--ink);
  color: var(--paper);
}

.picker__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 560px;
  overflow-y: auto;
  border-top: var(--border);
  border-bottom: var(--border);
  padding-right: 8px;
}

.picker__msg,
.picker__none {
  font-size: 14px;
}

.picker__manual {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 12px;
  padding: 16px;
  border: var(--border-dashed);
}

@media (max-width: 560px) {
  .picker__manual {
    grid-template-columns: 1fr;
  }
}
</style>
