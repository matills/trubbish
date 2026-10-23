<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useGsap } from '@/composables/motion/useGsap'

/** Cola de película (3-2-1) con la aguja barriendo cada segundo. */
const props = withDefaults(defineProps<{ from?: number }>(), { from: 3 })
const emit = defineEmits<{ done: [] }>()

const root = ref<HTMLElement | null>(null)
const n = ref(props.from)
const { run } = useGsap(root)

onMounted(() => {
  run(
    () => {
      const tl = gsap.timeline({ onComplete: () => emit('done') })
      for (let i = props.from; i >= 1; i--) {
        tl.call(() => {
          n.value = i
        })
          .fromTo(root.value, { '--sweep': '0deg' }, { '--sweep': '360deg', duration: 0.7, ease: 'none' })
          .fromTo('.leader__num', { scale: 1.25, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, duration: 0.18, ease: 'power2.out' }, '<')
      }
    },
    () => emit('done'),
  )
})
</script>

<template>
  <div ref="root" class="leader" role="status" :aria-label="`Comenzando en ${n}`">
    <span class="leader__sweep" aria-hidden="true" />
    <span class="leader__ring" aria-hidden="true" />
    <span class="leader__ring leader__ring--inner" aria-hidden="true" />
    <span class="leader__cross" aria-hidden="true" />
    <span class="leader__num" aria-hidden="true">{{ n }}</span>
  </div>
</template>

<style scoped>
.leader {
  --sweep: 0deg;
  position: relative;
  width: min(320px, 70vw);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: var(--paper);
  border: var(--border);
  overflow: hidden;
}

.leader__sweep {
  position: absolute;
  inset: 0;
  background: conic-gradient(from 0deg, var(--ink-40) 0 var(--sweep), transparent var(--sweep) 360deg);
}

.leader__ring {
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  border: 3px solid var(--ink);
}

.leader__ring--inner {
  inset: 22%;
  border-width: 2px;
}

.leader__cross {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(var(--ink), var(--ink)) center / 2px 100% no-repeat,
    linear-gradient(var(--ink), var(--ink)) center / 100% 2px no-repeat;
}

.leader__num {
  position: relative;
  font-size: clamp(90px, 22vw, 170px);
  font-weight: 900;
  font-stretch: 75%;
  line-height: 1;
  background: var(--paper);
  padding: 0 0.12em;
}
</style>
