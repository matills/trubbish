<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue'
import gsap from 'gsap'
import { useGsap } from '@/composables/motion/useGsap'

const props = withDefaults(defineProps<{ text: string; stamped: boolean; size?: number }>(), { size: 112 })
const el = ref<HTMLElement | null>(null)
const { run } = useGsap(el)
const uid = useId()
const arcId = `${uid}-arc`
const roughId = `${uid}-rough`

function settle(visible: boolean) {
  if (el.value) gsap.set(el.value, { scale: 1, rotate: -14, autoAlpha: visible ? 1 : 0 })
}

/** El sello baja desde arriba, golpea con un leve temblor del papel y queda girado. */
function slam() {
  run(
    () => {
      const node = el.value
      if (!node) return
      gsap
        .timeline()
        .fromTo(node, { scale: 2.6, rotate: -2, autoAlpha: 0 }, { scale: 1, rotate: -14, autoAlpha: 1, duration: 0.26, ease: 'power4.in' })
        .to(node.parentElement, { x: 3, y: 1, duration: 0.04, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x,y' })
    },
    () => settle(true),
  )
}

onMounted(() => settle(props.stamped))
watch(
  () => props.stamped,
  (now, before) => {
    if (now && !before) slam()
    else settle(now)
  },
)
</script>

<template>
  <div ref="el" class="stamp" :style="{ '--size': `${size}px` }" aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <defs>
        <path :id="arcId" d="M 60 60 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" />
        <filter :id="roughId">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g :filter="`url(#${roughId})`">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="4" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="2" />
        <text font-size="11" font-family="Courier Prime, monospace" font-weight="700" letter-spacing="3" fill="currentColor">
          <textPath :href="`#${arcId}`">★ EXPEDIENTE CERRADO ★ EXPEDIENTE CERRADO</textPath>
        </text>
        <rect x="8" y="49" width="104" height="22" fill="var(--paper)" stroke="currentColor" stroke-width="3" />
        <text x="60" y="66" text-anchor="middle" font-size="16" font-weight="900" font-family="Archivo Variable, sans-serif" letter-spacing="2" fill="currentColor">
          {{ text }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.stamp {
  width: var(--size);
  height: var(--size);
  color: var(--ink);
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: multiply;
}

:root[data-theme='negative'] .stamp {
  mix-blend-mode: screen;
}

svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
