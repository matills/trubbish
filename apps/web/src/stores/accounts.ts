import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AccountSource, AccountStatus, BulkImportResult, TrackedAccount } from '@trubbish/shared'
import { accountsService, type CreateAccountInput, type UpdateAccountInput } from '@/services'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<TrackedAccount[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      accounts.value = await accountsService.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded(): Promise<void> {
    if (!loaded.value) await fetchAll()
  }

  const counts = computed(() => {
    const byStatus: Record<AccountStatus, number> = { TO_REVIEW: 0, KEEP: 0, IN_PROGRESS: 0, DELETED: 0 }
    for (const a of accounts.value) byStatus[a.status]++
    const total = accounts.value.length
    const closable = total - byStatus.KEEP
    return { total, byStatus, closeRate: closable === 0 ? 0 : byStatus.DELETED / closable }
  })

  const domains = computed(() => new Set(accounts.value.map((a) => a.domain)))
  const serviceIds = computed(() => new Set(accounts.value.map((a) => a.service?.id).filter(Boolean)))

  function byId(id: number): TrackedAccount | undefined {
    return accounts.value.find((a) => a.id === id)
  }

  function upsertLocal(account: TrackedAccount): void {
    const i = accounts.value.findIndex((a) => a.id === account.id)
    if (i === -1) accounts.value = [...accounts.value, account]
    else accounts.value = accounts.value.map((a) => (a.id === account.id ? account : a))
  }

  async function fetchOne(id: number): Promise<TrackedAccount> {
    const account = await accountsService.get(id)
    upsertLocal(account)
    return account
  }

  async function create(input: CreateAccountInput): Promise<TrackedAccount> {
    const account = await accountsService.create(input)
    upsertLocal(account)
    return account
  }

  async function bulk(source: AccountSource, items: { domain: string; name?: string }[]): Promise<BulkImportResult> {
    const result = await accountsService.bulk(source, items)
    if (result.created > 0) await fetchAll()
    return result
  }

  async function update(id: number, input: UpdateAccountInput): Promise<TrackedAccount> {
    const account = await accountsService.update(id, input)
    upsertLocal(account)
    return account
  }

  async function remove(id: number): Promise<void> {
    await accountsService.remove(id)
    accounts.value = accounts.value.filter((a) => a.id !== id)
  }

  function reset(): void {
    accounts.value = []
    loaded.value = false
  }

  return { accounts, loading, loaded, counts, domains, serviceIds, byId, fetchAll, ensureLoaded, fetchOne, create, bulk, update, remove, reset }
})
