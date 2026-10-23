<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { registerIrisOverlay } from '@/composables/motion/iris'

const el = ref<HTMLElement | null>(null)
onMounted(() => registerIrisOverlay(el.value))
onUnmounted(() => registerIrisOverlay(null))
</script>

<template>
  <div ref="el" class="iris" aria-hidden="true" />
</template>

<style scoped>
.iris {
  --x: 50%;
  --y: 50%;
  --r: 150vmax;
  position: fixed;
  inset: 0;
  z-index: 8000;
  pointer-events: none;
  visibility: hidden;
  background: radial-gradient(circle at var(--x) var(--y), transparent var(--r), var(--ink) calc(var(--r) + 1px));
}
</style>
