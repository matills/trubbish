<script setup lang="ts">
import type { AccountStatus } from '@trubbish/shared'
import { STATUS_LABEL } from '@/utils/labels'

defineProps<{ status: AccountStatus }>()
</script>

<template>
  <span class="status mono" :class="`status--${status.toLowerCase()}`">
    <span class="status__swatch" aria-hidden="true" />
    {{ STATUS_LABEL[status] }}
  </span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* El estado se lee en la textura de la muestra, nunca en un color. */
.status__swatch {
  width: 14px;
  height: 14px;
  border: 2px solid var(--ink);
}

.status--to_review .status__swatch {
  background: var(--paper);
}

.status--keep .status__swatch {
  border-style: dotted;
  border-width: 3px;
}

.status--in_progress .status__swatch {
  background-image: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 4px);
}

.status--deleted .status__swatch {
  background: var(--ink);
  border-radius: 50%;
}
</style>
