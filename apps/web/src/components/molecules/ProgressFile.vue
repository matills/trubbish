<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGsap } from '@/composables/motion/useGsap'

/** Barra de expediente: se llena con rayas hasta cerrar el caso. */
const props = defineProps<{ ratio: number; label: string }>()
const bar = ref<HTMLElement | null>(null)
const { run } = useGsap(bar)

function animateTo(ratio: number) {
  const scaleX = Math.max(0, Math.min(1, ratio))
  run(
    () => gsap.to(bar.value, { scaleX, duration: 1.1, ease: 'power3.out' }),
    () => gsap.set(bar.value, { scaleX }),
  )
}

onMounted(() => animateTo(props.ratio))
watch(() => props.ratio, animateTo)
</script>

<template>
  <div class="progress">
    <div class="progress__track" role="progressbar" :aria-valuenow="Math.round(ratio * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="label">
      <div ref="bar" class="progress__bar" />
      <span class="progress__ticks" aria-hidden="true" />
    </div>
    <div class="progress__legend mono">
      <span>{{ label }}</span>
      <strong>{{ Math.round(ratio * 100) }}%</strong>
    </div>
  </div>
</template>

<style scoped>
.progress {
  display: grid;
  gap: 8px;
}

.progress__track {
  position: relative;
  height: 28px;
  border: var(--border);
  overflow: hidden;
}

.progress__bar {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform: scaleX(0);
  background-image: repeating-linear-gradient(-45deg, var(--ink) 0 6px, transparent 6px 11px);
  border-right: 3px solid var(--ink);
}

.progress__ticks {
  position: absolute;
  inset: auto 0 0;
  height: 6px;
  background: repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 10%);
}

.progress__legend {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
