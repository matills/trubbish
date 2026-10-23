<script setup lang="ts">
import { toRef } from 'vue'
import { useTypewriter } from '@/composables/motion/useTypewriter'

const props = withDefaults(defineProps<{ text: string; cps?: number; tag?: string }>(), { cps: 60, tag: 'p' })
const { shown, typing, finish } = useTypewriter(toRef(props, 'text'), props.cps)
</script>

<template>
  <component :is="tag" class="tw mono" @click="finish">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true">{{ shown }}<span v-if="typing" class="tw__caret">▌</span></span>
  </component>
</template>

<style scoped>
.tw {
  white-space: pre-wrap;
}

.tw__caret {
  animation: blink 0.5s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
