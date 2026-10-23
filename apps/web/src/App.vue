<script setup lang="ts">
import { RouterView } from 'vue-router'
import FilmGrain from '@/components/atoms/FilmGrain.vue'
import AppHeader from '@/components/organisms/AppHeader.vue'
import IrisOverlay from '@/components/organisms/IrisOverlay.vue'
import { irisClose, irisOpen } from '@/composables/motion/iris'
import { usePreferencesStore } from '@/stores/preferences'

// Aplica tema y movimiento guardados antes del primer render de las páginas.
usePreferencesStore()
</script>

<template>
  <a href="#contenido" class="skip">Saltar al contenido</a>
  <AppHeader />
  <main id="contenido">
    <RouterView v-slot="{ Component, route }">
      <Transition :css="false" mode="out-in" @leave="irisClose" @enter="irisOpen">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>
  <footer class="footer">
    <div class="container footer__inner mono">
      <span>Borrar mi vida digital · Sin contraseñas, nunca.</span>
      <span>Tus datos se guardan cifrados y los podés borrar cuando quieras.</span>
    </div>
  </footer>
  <IrisOverlay />
  <FilmGrain />
</template>

<style scoped>
.skip {
  position: absolute;
  left: 16px;
  top: -60px;
  z-index: 200;
  padding: 8px 12px;
  background: var(--ink);
  color: var(--paper);
}

.skip:focus {
  top: 8px;
}

main {
  min-height: 70vh;
}

.footer {
  margin-top: 96px;
  border-top: var(--border);
  padding: 24px 0;
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}
</style>
