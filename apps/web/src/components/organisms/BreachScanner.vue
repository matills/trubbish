<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'
import { AccountSource, ScanStatus, type Breach } from '@borrar/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import FilmCountdown from '@/components/atoms/FilmCountdown.vue'
import OpArt from '@/components/atoms/OpArt.vue'
import { useGsap } from '@/composables/motion/useGsap'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { useBreachesStore } from '@/stores/breaches'
import { formatDate } from '@/utils/labels'

const accounts = useAccountsStore()
const breachesStore = useBreachesStore()
const { scan, scanning } = storeToRefs(breachesStore)
const { user } = storeToRefs(useAuthStore())
const { domains } = storeToRefs(accounts)

const root = ref<HTMLElement | null>(null)
const { run } = useGsap(root)
const phase = ref<'idle' | 'countdown' | 'waiting' | 'done'>('idle')
const countdownDone = ref(false)
const error = ref<string | null>(null)
const adding = ref(false)

const breaches = computed(() => (scan.value?.status === ScanStatus.DONE ? scan.value.breaches : []))
const pendingBreaches = computed(() => breaches.value.filter((b) => b.domain && !domains.value.has(b.domain)))

onMounted(async () => {
  await breachesStore.fetchLatest().catch(() => undefined)
  if (scan.value?.status === ScanStatus.DONE) phase.value = 'done'
})

async function start() {
  error.value = null
  countdownDone.value = false
  phase.value = 'countdown'
  try {
    await breachesStore.startScan()
    if (scan.value?.status === ScanStatus.FAILED) throw new Error('La consulta falló. Probá de nuevo en unos minutos.')
    // Si la respuesta llegó antes, la cuenta regresiva termina igual: es la entrada a los resultados.
    await waitFor(() => countdownDone.value)
    phase.value = 'done'
    await nextTick()
    reveal()
  } catch (err) {
    error.value = errorMessage(err)
    phase.value = 'idle'
  }
}

function onCountdownDone() {
  countdownDone.value = true
  if (scanning.value) phase.value = 'waiting'
}

function waitFor(cond: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => (cond() ? resolve() : setTimeout(tick, 80))
    tick()
  })
}

/** Las brechas aparecen como titulares de diario, una tras otra. */
function reveal() {
  run(() => {
    gsap.from('.breach', { y: 30, autoAlpha: 0, rotate: () => gsap.utils.random(-2, 2), stagger: 0.12, duration: 0.5, ease: 'power3.out' })
    gsap.from('.verdict__count', { scale: 3, autoAlpha: 0, duration: 0.5, ease: 'power4.in' })
  })
}

async function add(list: Breach[]) {
  adding.value = true
  error.value = null
  try {
    await accounts.bulk(AccountSource.BREACH, list.map((b) => ({ domain: b.domain, name: b.title })))
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <div ref="root" class="scanner">
    <template v-if="phase === 'idle'">
      <p>
        Consultamos <strong>Have I Been Pwned</strong>, el registro público de filtraciones, con tu correo verificado
        <span class="mono">({{ user?.email }})</span>. Si tu dirección apareció en una brecha, ese servicio tiene una cuenta tuya
        y conviene cerrarla primero.
      </p>
      <BaseButton size="lg" @click="start">Consultar filtraciones</BaseButton>
    </template>

    <div v-else-if="phase === 'countdown'" class="scanner__stage">
      <FilmCountdown @done="onCountdownDone" />
    </div>

    <div v-else-if="phase === 'waiting'" class="scanner__stage">
      <OpArt variant="moire" class="scanner__op" />
      <p class="eyebrow scanner__wait" role="status">Revisando los archivos…</p>
    </div>

    <template v-else>
      <div class="verdict">
        <span class="verdict__count">{{ breaches.length }}</span>
        <div>
          <h3>{{ breaches.length === 1 ? 'Filtración encontrada' : 'Filtraciones encontradas' }}</h3>
          <p class="mono">
            Consulta del {{ scan ? formatDate(scan.createdAt) : '' }}
            <template v-if="scan?.demo"> · <strong>modo demo</strong>: falta configurar HIBP_API_KEY</template>
          </p>
        </div>
      </div>

      <p v-if="breaches.length === 0">Tu correo no aparece en filtraciones conocidas. No garantiza nada: solo que no hay registros públicos.</p>

      <ul v-else class="breaches">
        <li v-for="b in breaches" :key="b.name" class="breach">
          <div class="breach__head">
            <h4>{{ b.title }}</h4>
            <span class="mono">{{ b.domain || 'sin dominio' }} · {{ formatDate(b.breachDate) }}</span>
          </div>
          <p class="mono breach__data">Expuso: {{ b.dataClasses.join(', ') }}</p>
          <span v-if="b.domain && domains.has(b.domain)" class="mono breach__added">✓ En el expediente</span>
          <BaseButton v-else-if="b.domain" size="sm" variant="outline" :loading="adding" @click="add([b])">Agregar</BaseButton>
        </li>
      </ul>

      <div class="scanner__actions">
        <BaseButton v-if="pendingBreaches.length > 1" :loading="adding" @click="add(pendingBreaches)">
          Agregar las {{ pendingBreaches.length }} al expediente
        </BaseButton>
        <BaseButton variant="ghost" @click="start">Volver a consultar</BaseButton>
      </div>
    </template>

    <p v-if="error" class="mono scanner__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.scanner {
  display: grid;
  gap: 20px;
  justify-items: start;
}

.scanner > p {
  max-width: 62ch;
}

.scanner__stage {
  position: relative;
  justify-self: stretch;
  display: grid;
  place-items: center;
  min-height: 360px;
  border: var(--border);
  overflow: hidden;
}

.scanner__op {
  position: absolute;
  inset: 0;
}

.scanner__wait {
  position: relative;
  padding: 8px 14px;
  background: var(--paper);
  border: var(--border);
}

.verdict {
  display: flex;
  align-items: center;
  gap: 20px;
}

.verdict__count {
  display: grid;
  place-items: center;
  min-width: 96px;
  height: 96px;
  padding: 0 12px;
  background: var(--ink);
  color: var(--paper);
  font-size: 64px;
  font-weight: 900;
  font-stretch: 70%;
}

.verdict h3 {
  font-size: clamp(26px, 4vw, 40px);
  font-stretch: 80%;
}

.breaches {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
  justify-self: stretch;
}

.breach {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px 16px;
  padding: 14px 16px;
  border: var(--border);
  border-left-width: 10px;
}

.breach__head {
  display: grid;
  gap: 2px;
}

.breach h4 {
  font-size: 22px;
  font-stretch: 85%;
}

.breach__head span,
.breach__data {
  font-size: 13px;
  color: var(--ink-70);
}

.breach__data {
  grid-column: 1;
}

.breach__added {
  font-size: 12px;
  grid-row: 1;
  grid-column: 2;
}

.breach > :deep(.btn) {
  grid-row: 1;
  grid-column: 2;
}

.scanner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.scanner__error {
  padding: 10px 14px;
  border: 3px dashed var(--ink);
  font-weight: 700;
}
</style>
