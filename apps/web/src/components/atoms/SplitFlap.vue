<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import gsap from 'gsap'
import { useGsap } from '@/composables/motion/useGsap'

/** Contador de persianas tipo cartel de estación: cada dígito cae al cambiar. */
const props = withDefaults(defineProps<{ value: number; digits?: number; suffix?: string }>(), { digits: 3 })

const root = ref<HTMLElement | null>(null)
const { run } = useGsap(root)
const chars = computed(() => String(Math.max(0, Math.round(props.value))).padStart(props.digits, '0').split(''))
const label = computed(() => `${props.value}${props.suffix ?? ''}`)

watch(chars, async (next, prev) => {
  await Promise.resolve()
  run(() => {
    const cells = root.value?.querySelectorAll<HTMLElement>('.flap__digit')
    cells?.forEach((cell, i) => {
      if (next[i] === prev?.[i]) return
      gsap.fromTo(
        cell,
        { rotateX: -90, transformOrigin: '50% 0%' },
        { rotateX: 0, duration: 0.45, ease: 'steps(6)', delay: i * 0.06 },
      )
    })
  })
})
</script>

<template>
  <span ref="root" class="flap" :aria-label="label" role="img">
    <span v-for="(c, i) in chars" :key="i" class="flap__cell" aria-hidden="true">
      <span class="flap__digit">{{ c }}</span>
    </span>
    <span v-if="suffix" class="flap__suffix" aria-hidden="true">{{ suffix }}</span>
  </span>
</template>

<style scoped>
.flap {
  display: inline-flex;
  align-items: stretch;
  gap: 3px;
  perspective: 300px;
  font-family: var(--font-mono);
  font-weight: 700;
}

.flap__cell {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.05em;
  height: 1.4em;
  background: var(--ink);
  color: var(--paper);
  overflow: hidden;
}

/* La línea del medio de la persiana. */
.flap__cell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--paper);
  opacity: 0.6;
}

.flap__digit {
  display: block;
  line-height: 1;
  backface-visibility: hidden;
}

.flap__suffix {
  align-self: center;
  margin-left: 4px;
}
</style>
