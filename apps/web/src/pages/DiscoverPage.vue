<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import ReelTabs from '@/components/molecules/ReelTabs.vue'
import BreachScanner from '@/components/organisms/BreachScanner.vue'
import BrowserImport from '@/components/organisms/BrowserImport.vue'
import CatalogPicker from '@/components/organisms/CatalogPicker.vue'
import ConnectedAppsImport from '@/components/organisms/ConnectedAppsImport.vue'
import GuidedMemory from '@/components/organisms/GuidedMemory.vue'
import { useGsap } from '@/composables/motion/useGsap'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useCatalogStore } from '@/stores/catalog'

type Method = 'catalogo' | 'navegador' | 'apps' | 'filtraciones' | 'memoria'

const METHODS: { value: Method; label: string; title: string; lede: string }[] = [
  { value: 'catalogo', label: 'Catálogo', title: 'El catálogo', lede: 'Más de cien servicios comunes con su enlace de borrado y la dificultad. Buscá y agregá los que usaste.' },
  { value: 'navegador', label: 'Navegador', title: 'Contraseñas del navegador', lede: 'El método que más cuentas encuentra: tu navegador recuerda sitios que vos no.' },
  { value: 'apps', label: 'Apps conectadas', title: 'Entraste con un botón', lede: 'Cuentas abiertas con Google, Apple o Facebook, que no dejaron contraseña en ningún lado.' },
  { value: 'filtraciones', label: 'Filtraciones', title: 'Filtraciones', lede: 'Servicios que expusieron tu correo en una brecha de seguridad. Conviene cerrarlos primero.' },
  { value: 'memoria', label: 'Memoria guiada', title: 'Memoria guiada', lede: 'Un cuestionario por rubros para rellenar los huecos que los otros métodos no ven.' },
]

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const accounts = useAccountsStore()

const initial = METHODS.find((m) => m.value === route.query['metodo'])?.value ?? 'catalogo'
const method = ref<Method>(initial)
const panel = ref<HTMLElement | null>(null)
const { run } = useGsap(panel)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await Promise.all([catalog.load(), accounts.ensureLoaded()])
  } catch (err) {
    error.value = errorMessage(err)
  }
})

// Cambio de método: la sección entra como un cuadro nuevo de la película.
watch(method, (m) => {
  void router.replace({ query: { metodo: m } })
  run(() => {
    gsap.fromTo(panel.value, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power3.inOut' })
  })
})
</script>

<template>
  <div class="container page">
    <header class="page__head">
      <p class="eyebrow">Cinco métodos · ninguno alcanza solo</p>
      <h1>Descubrir</h1>
    </header>

    <ReelTabs v-model="method" :options="METHODS" aria-label="Método de descubrimiento" />
    <p v-if="error" class="mono" role="alert">{{ error }}</p>

    <section v-if="catalog.loaded" ref="panel" class="panel" role="tabpanel">
      <template v-for="m in METHODS" :key="m.value">
        <header v-if="m.value === method" class="panel__head">
          <h2>{{ m.title }}</h2>
          <p>{{ m.lede }}</p>
        </header>
      </template>
      <CatalogPicker v-if="method === 'catalogo'" />
      <BrowserImport v-else-if="method === 'navegador'" />
      <ConnectedAppsImport v-else-if="method === 'apps'" />
      <BreachScanner v-else-if="method === 'filtraciones'" />
      <GuidedMemory v-else />
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 28px;
  padding-top: 48px;
}

.page__head h1 {
  font-size: clamp(56px, 10vw, 120px);
  font-stretch: 70%;
}

.panel {
  display: grid;
  gap: 28px;
  padding: clamp(18px, 4vw, 36px);
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
  background: var(--paper);
}

.panel__head {
  display: grid;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: var(--border);
}

.panel__head h2 {
  font-size: clamp(32px, 5vw, 56px);
  font-stretch: 78%;
}

.panel__head p {
  max-width: 60ch;
  font-size: 18px;
}
</style>
