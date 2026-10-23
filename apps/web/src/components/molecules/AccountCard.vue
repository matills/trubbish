<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AccountStatus, type TrackedAccount } from '@trubbish/shared'
import DifficultyDots from '@/components/atoms/DifficultyDots.vue'
import RubberStamp from '@/components/atoms/RubberStamp.vue'
import StatusLabel from '@/components/atoms/StatusLabel.vue'
import { CATEGORY_LABEL, SOURCE_LABEL } from '@/utils/labels'

const props = defineProps<{ account: TrackedAccount; index: number; busy?: boolean }>()
const emit = defineEmits<{ status: [status: AccountStatus] }>()

const deleted = computed(() => props.account.status === AccountStatus.DELETED)
const fileNo = computed(() => `N.º ${String(props.account.id).padStart(4, '0')}`)
</script>

<template>
  <article class="card" :class="`card--${account.status.toLowerCase()}`" :data-id="account.id">
    <header class="card__head">
      <span class="eyebrow">{{ fileNo }}</span>
      <StatusLabel :status="account.status" />
    </header>

    <RouterLink :to="{ name: 'account', params: { id: account.id } }" class="card__title">
      <h3>{{ account.name }}</h3>
      <span class="card__domain mono">{{ account.domain }}</span>
    </RouterLink>

    <dl class="card__meta mono">
      <div>
        <dt>Origen</dt>
        <dd>{{ SOURCE_LABEL[account.source] }}</dd>
      </div>
      <div v-if="account.service">
        <dt>Rubro</dt>
        <dd>{{ CATEGORY_LABEL[account.service.category] }}</dd>
      </div>
      <div v-if="account.service">
        <dt>Dificultad</dt>
        <dd><DifficultyDots :difficulty="account.service.difficulty" /></dd>
      </div>
      <div v-else>
        <dt>Catálogo</dt>
        <dd>Sin datos</dd>
      </div>
    </dl>

    <footer class="card__actions">
      <template v-if="!deleted">
        <button
          v-if="account.status !== AccountStatus.KEEP"
          class="chip"
          type="button"
          :disabled="busy"
          @click="emit('status', AccountStatus.KEEP)"
        >
          Conservar
        </button>
        <button
          v-if="account.status !== AccountStatus.IN_PROGRESS"
          class="chip"
          type="button"
          :disabled="busy"
          @click="emit('status', AccountStatus.IN_PROGRESS)"
        >
          En proceso
        </button>
        <button class="chip chip--solid" type="button" :disabled="busy" @click="emit('status', AccountStatus.DELETED)">
          Borrada
        </button>
      </template>
      <button v-else class="chip" type="button" :disabled="busy" @click="emit('status', AccountStatus.TO_REVIEW)">
        Reabrir
      </button>
    </footer>

    <RubberStamp class="card__stamp" text="BORRADA" :stamped="deleted" :size="104" />
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 18px;
  border: var(--border);
  background: var(--paper);
  box-shadow: var(--shadow);
  transition:
    box-shadow 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}

/* La perforación de la ficha. */
.card::before {
  content: '';
  position: absolute;
  top: 12px;
  right: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--ink);
  background: var(--paper);
  transform: translateX(50%);
}

.card--keep {
  border-style: dashed;
}

.card--in_progress {
  background-image: repeating-linear-gradient(-45deg, var(--ink-10) 0 6px, transparent 6px 14px);
  background-size: 200% 200%;
  animation: progress-stripes 6s linear infinite;
}

.card--deleted {
  box-shadow: none;
}

.card--deleted .card__meta,
.card--deleted .card__domain {
  opacity: 0.55;
}

@keyframes progress-stripes {
  to {
    background-position: 100% 100%;
  }
}

.card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card__title {
  display: grid;
  gap: 4px;
  text-decoration: none;
}

.card__title h3 {
  font-size: clamp(24px, 3vw, 32px);
  font-stretch: 82%;
  overflow-wrap: anywhere;
}

.card__title:hover h3 {
  text-decoration: underline;
  text-decoration-thickness: 3px;
}

.card__domain {
  font-size: 14px;
  color: var(--ink-70);
}

.card__meta {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  gap: 4px 20px;
  margin: 0;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ink-40);
}

.card__meta dt {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-70);
}

.card__meta dd {
  margin: 2px 0 0;
  font-weight: 700;
}

.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 10px;
  border: var(--border);
  background: var(--paper);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 0.12s var(--ease-out),
    background-color 0.15s,
    color 0.15s;
}

.chip:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.chip:active:not(:disabled) {
  transform: translateY(2px);
}

.chip--solid {
  background: var(--ink);
  color: var(--paper);
}

.chip--solid:hover:not(:disabled) {
  background: var(--paper);
  color: var(--ink);
}

.chip:disabled {
  opacity: 0.4;
  cursor: wait;
}

.card__stamp {
  position: absolute;
  right: 14px;
  bottom: 44px;
}

@media (max-width: 420px) {
  .card__meta {
    grid-template-columns: repeat(2, auto);
  }
}
</style>
