<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RequestStatus, type DeletionRequest } from '@borrar/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import RequestCard from '@/components/molecules/RequestCard.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useRequestsStore } from '@/stores/requests'
import { daysUntil } from '@/utils/labels'

const store = useRequestsStore()
const accounts = useAccountsStore()
const { requests, loading } = storeToRefs(store)
const busyId = ref<number | null>(null)
const error = ref<string | null>(null)

// Primero lo vencido, después lo que vence antes; al final borradores y cerrados.
const sorted = computed(() =>
  [...requests.value].sort((a, b) => rank(a) - rank(b) || (a.dueAt && b.dueAt ? a.dueAt.localeCompare(b.dueAt) : 0)),
)
const overdue = computed(() => requests.value.filter((r) => r.status === RequestStatus.SENT && r.dueAt && daysUntil(r.dueAt) < 0).length)

function rank(r: DeletionRequest): number {
  if (r.status === RequestStatus.SENT) return r.dueAt && daysUntil(r.dueAt) < 0 ? 0 : 1
  if (r.status === RequestStatus.DRAFT) return 2
  return 3
}

onMounted(async () => {
  try {
    await Promise.all([store.fetchAll(), accounts.ensureLoaded()])
  } catch (err) {
    error.value = errorMessage(err)
  }
})

async function setStatus(r: DeletionRequest, status: RequestStatus) {
  busyId.value = r.id
  try {
    await store.setStatus(r.id, status)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div class="container page">
    <header class="page__head">
      <p class="eyebrow">Ley 25.326 · RGPD</p>
      <h1>Pedidos <span class="serif">legales</span></h1>
      <p v-if="overdue" class="page__alert mono">
        {{ overdue }} {{ overdue === 1 ? 'pedido tiene' : 'pedidos tienen' }} el plazo vencido. En Argentina podés denunciar ante la
        Agencia de Acceso a la Información Pública (AAIP).
      </p>
    </header>

    <p v-if="error" class="mono" role="alert">{{ error }}</p>

    <div v-if="sorted.length" class="list">
      <RequestCard
        v-for="r in sorted"
        :key="r.id"
        :request="r"
        :account-name="accounts.byId(r.accountId)?.name"
        :busy="busyId === r.id"
        @status="(s) => setStatus(r, s)"
        @remove="store.remove(r.id)"
      />
    </div>
    <div v-else-if="!loading" class="empty">
      <p>Todavía no redactaste pedidos. Se arman desde la ficha de cada cuenta, en la sección «Pedido legal».</p>
      <BaseButton :to="{ name: 'dossier' }">Ir al expediente</BaseButton>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 28px;
  padding-top: 48px;
}

.page__head {
  display: grid;
  gap: 12px;
}

.page__head h1 {
  font-size: clamp(56px, 10vw, 120px);
  font-stretch: 70%;
}

.page__alert {
  padding: 12px 16px;
  background: var(--ink);
  color: var(--paper);
  font-weight: 700;
}

.list {
  display: grid;
  gap: 18px;
}

.empty {
  display: grid;
  gap: 16px;
  justify-items: start;
  padding: 32px;
  border: var(--border-dashed);
}
</style>
