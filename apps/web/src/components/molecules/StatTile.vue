<script setup lang="ts">
import SplitFlap from '@/components/atoms/SplitFlap.vue'

withDefaults(defineProps<{ label: string; value: number; digits?: number; suffix?: string; inverted?: boolean }>(), {
  digits: 3,
})
</script>

<template>
  <div class="tile" :class="{ 'is-inverted': inverted }">
    <span class="eyebrow">{{ label }}</span>
    <SplitFlap class="tile__value" :value="value" :digits="digits" :suffix="suffix" />
  </div>
</template>

<style scoped>
.tile {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: var(--border);
  background: var(--paper);
}

.tile__value {
  font-size: clamp(28px, 4vw, 40px);
}

.is-inverted {
  background: var(--ink);
  color: var(--paper);
}

.is-inverted :deep(.flap__cell) {
  background: var(--paper);
  color: var(--ink);
}

.is-inverted :deep(.flap__cell::after) {
  background: var(--ink);
}
</style>
