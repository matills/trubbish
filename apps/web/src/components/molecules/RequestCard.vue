<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RequestStatus, type DeletionRequest } from '@trubbish/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import TypewriterText from '@/components/atoms/TypewriterText.vue'
import { LAW_LABEL, REQUEST_STATUS_LABEL, daysUntil, formatDate } from '@/utils/labels'

const props = defineProps<{ request: DeletionRequest; accountName?: string; typed?: boolean; busy?: boolean }>()
const emit = defineEmits<{ status: [status: RequestStatus]; remove: [] }>()

const open = ref(props.typed ?? false)
// El pedido recién redactado se abre solo, tipeándose.
watch(
  () => props.typed,
  (typed) => {
    if (typed) open.value = true
  },
)
const copied = ref(false)

const due = computed(() => (props.request.dueAt ? daysUntil(props.request.dueAt) : null))
const overdue = computed(() => props.request.status === RequestStatus.SENT && due.value !== null && due.value < 0)
const mailto = computed(() => {
  const r = props.request
  const params = new URLSearchParams({ subject: r.subject, body: r.body })
  return `mailto:${r.recipient ?? ''}?${params.toString().replace(/\+/g, '%20')}`
})

async function copy() {
  await navigator.clipboard.writeText(`${props.request.subject}\n\n${props.request.body}`)
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <article class="req" :class="{ 'is-overdue': overdue }">
    <header class="req__head">
      <div>
        <p class="eyebrow">{{ LAW_LABEL[request.law] }} · {{ formatDate(request.createdAt) }}</p>
        <h4>{{ accountName ?? request.subject }}</h4>
      </div>
      <div class="req__status mono">
        <strong>{{ REQUEST_STATUS_LABEL[request.status] }}</strong>
        <span v-if="request.status === RequestStatus.SENT && due !== null">
          {{ overdue ? `Plazo vencido hace ${-due} d` : due === 0 ? 'Vence hoy' : `Vence en ${due} d` }}
        </span>
      </div>
    </header>

    <p class="mono req__to">Para: {{ request.recipient ?? 'buscá el contacto de privacidad en el sitio del servicio' }}</p>

    <button class="req__toggle mono" type="button" :aria-expanded="open" @click="open = !open">
      {{ open ? '▾ Ocultar la carta' : '▸ Ver la carta' }}
    </button>
    <div v-if="open" class="req__letter">
      <p class="mono req__subject">Asunto: {{ request.subject }}</p>
      <TypewriterText v-if="typed" :text="request.body" :cps="90" />
      <p v-else class="mono req__body">{{ request.body }}</p>
    </div>

    <footer class="req__actions">
      <BaseButton size="sm" variant="outline" @click="copy">{{ copied ? '✓ Copiada' : 'Copiar' }}</BaseButton>
      <BaseButton size="sm" variant="outline" :href="mailto">Abrir en el correo</BaseButton>
      <BaseButton v-if="request.status === RequestStatus.DRAFT" size="sm" :loading="busy" @click="emit('status', RequestStatus.SENT)">
        Ya la envié
      </BaseButton>
      <template v-if="request.status === RequestStatus.SENT">
        <BaseButton size="sm" :loading="busy" @click="emit('status', RequestStatus.ANSWERED)">Respondieron</BaseButton>
        <BaseButton size="sm" variant="outline" :loading="busy" @click="emit('status', RequestStatus.IGNORED)">No respondieron</BaseButton>
      </template>
      <BaseButton size="sm" variant="ghost" @click="emit('remove')">Descartar</BaseButton>
    </footer>
  </article>
</template>

<style scoped>
.req {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: var(--border);
  background: var(--paper);
}

.req.is-overdue {
  background: var(--ink);
  color: var(--paper);
}

.req.is-overdue :deep(.btn--outline) {
  border-color: var(--paper);
}

.req__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.req__head h4 {
  font-size: 24px;
  font-stretch: 82%;
}

.req__status {
  display: grid;
  justify-items: end;
  font-size: 13px;
  text-transform: uppercase;
}

.req__to {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.req__toggle {
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
}

/* La carta, en papel de máquina de escribir con renglones. */
.req__letter {
  display: grid;
  gap: 12px;
  padding: 24px clamp(16px, 4vw, 40px);
  border: var(--border);
  background:
    repeating-linear-gradient(transparent 0 27px, var(--ink-10) 27px 28px),
    var(--paper);
  color: var(--ink);
  font-size: 15px;
  line-height: 28px;
  max-height: 520px;
  overflow-y: auto;
}

.req__subject {
  font-weight: 700;
}

.req__body {
  white-space: pre-wrap;
}

.req__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
