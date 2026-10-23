<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { AccountStatus, type TrackedAccount } from '@borrar/shared'
import AccountCard from '@/components/molecules/AccountCard.vue'
import ConfirmDialog from '@/components/molecules/ConfirmDialog.vue'
import ReelTabs from '@/components/molecules/ReelTabs.vue'
import { useGsap } from '@/composables/motion/useGsap'
import { isReducedMotion } from '@/composables/motion/reduced'
import { ApiError, errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'

type Filter = 'ALL' | AccountStatus

const store = useAccountsStore()
const { accounts, counts } = storeToRefs(store)

const root = ref<HTMLElement | null>(null)
const { run } = useGsap(root)
const filter = ref<Filter>('ALL')
const shownFilter = ref<Filter>('ALL')
const busyId = ref<number | null>(null)
const error = ref<string | null>(null)
const pending = ref<{ account: TrackedAccount } | null>(null)

const tabs = computed(() => [
  { value: 'ALL' as Filter, label: 'Todas', count: counts.value.total },
  { value: AccountStatus.TO_REVIEW as Filter, label: 'Por revisar', count: counts.value.byStatus.TO_REVIEW },
  { value: AccountStatus.IN_PROGRESS as Filter, label: 'En proceso', count: counts.value.byStatus.IN_PROGRESS },
  { value: AccountStatus.KEEP as Filter, label: 'Conservar', count: counts.value.byStatus.KEEP },
  { value: AccountStatus.DELETED as Filter, label: 'Borradas', count: counts.value.byStatus.DELETED },
])

const visible = (a: TrackedAccount) => shownFilter.value === 'ALL' || a.status === shownFilter.value
const emptyFilter = computed(() => accounts.value.length > 0 && !accounts.value.some(visible))

// Filtrar con Flip: las fichas que quedan se reacomodan, las otras se van achicándose.
watch(filter, async (next) => {
  if (isReducedMotion() || !root.value) {
    shownFilter.value = next
    return
  }
  const state = Flip.getState(root.value.querySelectorAll('.grid__item'))
  shownFilter.value = next
  await nextTick()
  Flip.from(state, {
    duration: 0.55,
    ease: 'power3.inOut',
    stagger: 0.02,
    absolute: true,
    onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.4 }),
    onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.3 }),
  })
})

onMounted(() => {
  run(() => {
    gsap.from('.grid__item', {
      y: 60,
      rotate: () => gsap.utils.random(-4, 4),
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: { each: 0.05, from: 'start' },
    })
  })
})

async function changeStatus(account: TrackedAccount, status: AccountStatus, confirmSensitive = false) {
  busyId.value = account.id
  error.value = null
  try {
    await store.update(account.id, { status, confirmSensitive })
    pending.value = null
  } catch (err) {
    if (err instanceof ApiError && err.code === 'SENSITIVE_CONFIRMATION_REQUIRED') pending.value = { account }
    else error.value = errorMessage(err)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <section ref="root" class="dossier">
    <ReelTabs v-model="filter" :options="tabs" aria-label="Filtrar por estado" />
    <p v-if="error" class="dossier__error mono" role="alert">{{ error }}</p>

    <ul class="grid">
      <li v-for="(account, i) in accounts" :key="account.id" class="grid__item" :class="{ 'is-hidden': !visible(account) }" :data-flip-id="account.id">
        <AccountCard :account="account" :index="i" :busy="busyId === account.id" @status="(s) => changeStatus(account, s)" />
      </li>
    </ul>
    <p v-if="emptyFilter" class="dossier__empty mono">No hay fichas con este estado.</p>

    <ConfirmDialog
      :open="!!pending"
      :title="`¿Ya no necesitás ${pending?.account.name ?? ''}?`"
      confirm-label="Sí, está borrada"
      :busy="busyId !== null"
      @cancel="pending = null"
      @confirm="pending && changeStatus(pending.account, AccountStatus.DELETED, true)"
    >
      <p>
        Es una cuenta de un rubro sensible (finanzas, trabajo, salud o Estado). Antes de marcarla como borrada, confirmá que
        bajaste los comprobantes que te sirvan y que no tenés saldo, deudas ni trámites pendientes.
      </p>
    </ConfirmDialog>
  </section>
</template>

<style scoped>
.dossier {
  display: grid;
  gap: 24px;
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 24px;
}

.grid__item.is-hidden {
  display: none;
}

.dossier__error {
  padding: 10px 14px;
  border: 3px dashed var(--ink);
  font-weight: 700;
}

.dossier__empty {
  padding: 32px;
  text-align: center;
  border: var(--border-dashed);
}
</style>
