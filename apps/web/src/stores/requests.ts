import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DeletionRequest, RequestStatus } from '@borrar/shared'
import { requestsService, type CreateRequestInput } from '@/services'
import { useAccountsStore } from './accounts'

export const useRequestsStore = defineStore('requests', () => {
  const requests = ref<DeletionRequest[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      requests.value = await requestsService.list()
    } finally {
      loading.value = false
    }
  }

  const byAccount = computed(() => {
    const map = new Map<number, DeletionRequest[]>()
    for (const r of requests.value) map.set(r.accountId, [...(map.get(r.accountId) ?? []), r])
    return map
  })

  async function create(input: CreateRequestInput): Promise<DeletionRequest> {
    const req = await requestsService.create(input)
    requests.value = [req, ...requests.value]
    return req
  }

  async function setStatus(id: number, status: RequestStatus): Promise<DeletionRequest> {
    const updated = await requestsService.setStatus(id, status)
    requests.value = requests.value.map((r) => (r.id === id ? updated : r))
    // Mandar el pedido pasa la cuenta a "en proceso" en el backend.
    await useAccountsStore().fetchOne(updated.accountId)
    return updated
  }

  async function remove(id: number): Promise<void> {
    await requestsService.remove(id)
    requests.value = requests.value.filter((r) => r.id !== id)
  }

  function reset(): void {
    requests.value = []
  }

  return { requests, loading, byAccount, fetchAll, create, setStatus, remove, reset }
})
