<script setup lang="ts">
import { computed } from 'vue'
import type { Difficulty } from '@borrar/shared'
import { DIFFICULTY_LABEL, DIFFICULTY_LEVEL } from '@/utils/labels'

const props = defineProps<{ difficulty: Difficulty; showLabel?: boolean }>()
const level = computed(() => DIFFICULTY_LEVEL[props.difficulty])
</script>

<template>
  <span class="dots" :aria-label="`Dificultad: ${DIFFICULTY_LABEL[difficulty]}`" role="img">
    <span v-for="i in 4" :key="i" class="dot" :class="{ on: i <= level }" aria-hidden="true" />
    <span v-if="showLabel" class="dots__label mono" aria-hidden="true">{{ DIFFICULTY_LABEL[difficulty] }}</span>
  </span>
</template>

<style scoped>
.dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--ink);
}

.dot.on {
  background: var(--ink);
}

.dots__label {
  margin-left: 6px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
