<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'
import BaseButton from '@/components/atoms/BaseButton.vue'
import OpArt from '@/components/atoms/OpArt.vue'
import HeroSequence from '@/components/organisms/HeroSequence.vue'
import { useGsap } from '@/composables/motion/useGsap'
import { useAuthStore } from '@/stores/auth'

const { user } = storeToRefs(useAuthStore())
const ctaTo = computed(() => (user.value ? '/expediente' : '/entrar'))

const root = ref<HTMLElement | null>(null)
const { run } = useGsap(root)

const STEPS = [
  { title: 'Verificás tu correo', text: 'Te mandamos un código. Sin eso no se busca nada: así nadie puede investigar una dirección ajena.' },
  { title: 'Armamos el expediente', text: 'Catálogo de servicios, contraseñas exportadas del navegador, apps conectadas, filtraciones y un cuestionario de memoria.' },
  { title: 'Cerrás cuenta por cuenta', text: 'Enlace directo de borrado y su dificultad. Si no hay botón, redactamos el pedido legal de supresión.' },
]

const METHODS = ['Catálogo', 'Navegador', 'Apps conectadas', 'Filtraciones', 'Memoria guiada']

onMounted(() => {
  run(() => {
    gsap.utils.toArray<HTMLElement>('.frame').forEach((frame) => {
      gsap.from(frame, {
        y: 80,
        rotate: gsap.utils.random(-3, 3),
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: frame, start: 'top 85%' },
      })
    })
    gsap.from('.never li', {
      xPercent: -15,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.never', start: 'top 75%' },
    })
    gsap.to('.marquee__track', { xPercent: -50, duration: 18, ease: 'none', repeat: -1 })
    gsap.from('.finale__title', {
      scale: 0.4,
      autoAlpha: 0,
      letterSpacing: '0.4em',
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.finale', start: 'top 70%' },
    })
  })
})
</script>

<template>
  <div ref="root">
    <HeroSequence :cta-to="ctaTo" />

    <div class="marquee" aria-hidden="true">
      <div class="marquee__track">
        <span v-for="n in 2" :key="n" class="marquee__set">
          <span v-for="m in METHODS" :key="m">{{ m }} <span class="marquee__dot">●</span></span>
        </span>
      </div>
    </div>

    <section id="como-funciona" class="container steps">
      <p class="eyebrow">Cómo funciona</p>
      <h2 class="steps__title">Tres rollos, <span class="serif">una</span> película</h2>
      <ol class="frames">
        <li v-for="(s, i) in STEPS" :key="s.title" class="frame">
          <span class="frame__no">{{ i + 1 }}</span>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="never">
      <div class="container never__inner">
        <h2>Lo que <span class="serif">nunca</span> hacemos</h2>
        <ul>
          <li><strong>Pedirte contraseñas.</strong> Cada cuenta la borrás vos; te damos el enlace, los pasos y el texto.</li>
          <li><strong>Buscar correos ajenos.</strong> Solo analizamos una dirección que demuestres controlar.</li>
          <li><strong>Prometer el 100%.</strong> Los sitios chicos u olvidados pueden quedar afuera, y te lo decimos.</li>
          <li><strong>Guardar tu mapa en claro.</strong> La lista de cuentas va cifrada y la borrás entera con un botón.</li>
        </ul>
      </div>
    </section>

    <section class="finale">
      <OpArt class="finale__op" variant="rings" />
      <div class="finale__box">
        <h2 class="finale__title">Fin</h2>
        <p>de las cuentas olvidadas.</p>
        <BaseButton :to="ctaTo" size="lg">Empezar ahora</BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.marquee {
  overflow: hidden;
  background: var(--ink);
  color: var(--paper);
  border-bottom: var(--border);
  padding: 14px 0;
}

.marquee__track {
  display: flex;
  width: max-content;
}

.marquee__set {
  display: flex;
  gap: 32px;
  padding-right: 32px;
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 900;
  font-stretch: 75%;
  text-transform: uppercase;
  white-space: nowrap;
}

.marquee__dot {
  font-size: 0.5em;
  vertical-align: middle;
}

.steps {
  display: grid;
  gap: 24px;
  padding-top: 96px;
  padding-bottom: 96px;
}

.steps__title {
  font-size: clamp(44px, 7vw, 96px);
  font-stretch: 75%;
}

.frames {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 28px;
}

/* Cada paso es un cuadro de película con perforaciones. */
.frame {
  position: relative;
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 44px 24px 36px;
  border: 3px solid var(--ink);
  background: var(--paper);
  box-shadow: var(--shadow-lg);
}

.frame::before,
.frame::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  height: 10px;
  background: repeating-linear-gradient(90deg, var(--ink) 0 12px, transparent 12px 22px);
}

.frame::before {
  top: 10px;
}

.frame::after {
  bottom: 10px;
}

.frame__no {
  font-size: 110px;
  font-weight: 900;
  font-stretch: 62%;
  line-height: 0.8;
}

.frame h3 {
  font-size: 30px;
  font-stretch: 80%;
}

.never {
  background: var(--ink);
  color: var(--paper);
  padding: 96px 0;
}

.never__inner {
  display: grid;
  gap: 32px;
}

.never h2 {
  font-size: clamp(44px, 7vw, 96px);
  font-stretch: 75%;
}

.never ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}

.never li {
  padding: 18px 0;
  border-top: 2px solid var(--paper);
  font-size: clamp(18px, 2vw, 22px);
}

.never li strong {
  text-transform: uppercase;
  font-stretch: 85%;
}

.finale {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 70vh;
  overflow: hidden;
  border-bottom: var(--border);
}

.finale__op {
  position: absolute;
  inset: 0;
}

.finale__box {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 32px 40px;
  background: var(--paper);
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.finale__title {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 400;
  text-transform: none;
  font-size: clamp(90px, 16vw, 200px);
  line-height: 0.8;
}

.finale__box p {
  font-family: var(--font-mono);
  font-size: 18px;
  margin-bottom: 8px;
}
</style>
