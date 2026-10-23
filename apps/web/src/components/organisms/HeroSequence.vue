<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import BaseButton from '@/components/atoms/BaseButton.vue'
import { useGsap } from '@/composables/motion/useGsap'

/**
 * Títulos estilo Saul Bass: barras recortadas en papel cruzan el cuadro,
 * componen el titular y se reacomodan al scrollear.
 */
defineProps<{ ctaTo: string }>()

const root = ref<HTMLElement | null>(null)
const { run } = useGsap(root)

onMounted(() => {
  run(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from('.bar', { xPercent: (i) => (i % 2 ? 120 : -120), duration: 0.9, stagger: 0.08 })
        .from('.disc', { scale: 0, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.5')
        .from('.line__inner', { yPercent: 110, duration: 0.8, stagger: 0.12 }, '-=0.5')
        .fromTo('.line--wide .line__inner', { fontStretch: '62%' }, { fontStretch: '125%', duration: 1.2, ease: 'power2.inOut' }, '-=0.4')
        .from('.strike', { scaleX: 0, duration: 0.5, ease: 'power3.inOut' }, '-=0.6')
        .from('.hero__lede, .hero__cta', { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.1 }, '-=0.4')

      // Al bajar, las barras se separan y el disco rueda fuera del cuadro.
      gsap.to('.bar--a', { xPercent: -40, scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.bar--b', { xPercent: 40, scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.disc', { x: '30vw', rotate: 240, scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true } })
    },
  )
})
</script>

<template>
  <section ref="root" class="hero">
    <div class="hero__shapes" aria-hidden="true">
      <span class="bar bar--a" />
      <span class="bar bar--b" />
      <span class="bar bar--c" />
      <span class="disc"><span class="disc__hole" /></span>
    </div>

    <div class="container hero__content">
      <p class="eyebrow hero__kicker">Expediente personal · Año 1964 · Caso abierto</p>
      <h1 class="hero__title">
        <span class="line"><span class="line__inner">Borrar</span><span class="strike" aria-hidden="true" /></span>
        <span class="line"><span class="line__inner serif">mi vida</span></span>
        <span class="line line--wide"><span class="line__inner">Digital</span></span>
      </h1>
      <p class="hero__lede">
        Nadie recuerda todos los lugares donde dejó su correo. Te ayudamos a encontrar esas cuentas olvidadas y a cerrarlas
        una por una, sin pedirte nunca una contraseña.
      </p>
      <div class="hero__cta">
        <BaseButton :to="ctaTo" size="lg">Abrir mi expediente</BaseButton>
        <BaseButton href="#como-funciona" variant="ghost">Cómo funciona ↓</BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: calc(100svh - 66px);
  display: grid;
  align-items: center;
  overflow: hidden;
  border-bottom: var(--border);
}

.hero__shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bar {
  position: absolute;
  background: var(--ink);
}

.bar--a {
  top: 9%;
  left: -5%;
  width: 62%;
  height: 7vh;
}

.bar--b {
  bottom: 12%;
  right: -5%;
  width: 48%;
  height: 3.2vh;
}

.bar--c {
  top: 0;
  bottom: 0;
  right: 18%;
  width: 14px;
}

.disc {
  position: absolute;
  right: 6%;
  top: 22%;
  width: clamp(140px, 24vw, 340px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, var(--ink) 0 5px, var(--paper) 5px 13px);
  display: grid;
  place-items: center;
  border: 3px solid var(--ink);
}

.disc__hole {
  width: 22%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--paper);
  border: 3px solid var(--ink);
}

.hero__content {
  position: relative;
  display: grid;
  gap: 28px;
  padding-top: 72px;
  padding-bottom: 72px;
}

.hero__kicker {
  background: var(--paper);
  justify-self: start;
  padding: 4px 8px;
  border: var(--border);
}

.hero__title {
  display: grid;
  gap: 0.02em;
  font-size: clamp(64px, 14vw, 200px);
  line-height: 0.86;
}

.line {
  position: relative;
  display: block;
  overflow: hidden;
  padding-bottom: 0.04em;
  justify-self: start;
}

.line__inner {
  display: inline-block;
  font-stretch: 70%;
  font-weight: 900;
  background: var(--paper);
  padding: 0 0.05em;
}

.line__inner.serif {
  font-weight: 400;
  font-size: 0.82em;
  padding-right: 0.15em;
}

.line--wide .line__inner {
  font-stretch: 125%;
}

.strike {
  position: absolute;
  left: 0;
  right: 0;
  top: 48%;
  height: 0.09em;
  background: var(--ink);
  transform-origin: left;
}

.hero__lede {
  max-width: 34ch;
  font-size: clamp(18px, 2vw, 22px);
  background: var(--paper);
  padding: 4px 0;
}

.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

@media (max-width: 720px) {
  .disc {
    top: auto;
    bottom: 6%;
    right: -12%;
    opacity: 0.9;
  }
  .bar--c {
    display: none;
  }
}
</style>
