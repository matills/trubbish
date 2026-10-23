<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountsStore } from '@/stores/accounts'

const { user } = storeToRefs(useAuthStore())
const { counts, loaded } = storeToRefs(useAccountsStore())
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink :to="user ? { name: 'dossier' } : { name: 'landing' }" class="logo" aria-label="Borrar mi vida digital, inicio">
        <span class="logo__word">Borrar</span>
        <span class="logo__rest serif">mi vida digital</span>
      </RouterLink>

      <nav v-if="user" class="nav" aria-label="Principal">
        <RouterLink :to="{ name: 'dossier' }" class="nav__link">
          Expediente <span v-if="loaded" class="nav__count mono">{{ counts.total }}</span>
        </RouterLink>
        <RouterLink :to="{ name: 'discover' }" class="nav__link">Descubrir</RouterLink>
        <RouterLink :to="{ name: 'requests' }" class="nav__link">Pedidos</RouterLink>
        <RouterLink :to="{ name: 'settings' }" class="nav__link">Ajustes</RouterLink>
      </nav>
      <nav v-else class="nav" aria-label="Principal">
        <RouterLink :to="{ name: 'login' }" class="nav__link nav__link--cta">Entrar</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--paper);
  border-bottom: var(--border);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  flex-wrap: wrap;
}

.logo {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
}

.logo__word {
  position: relative;
  font-size: 24px;
  font-weight: 900;
  font-stretch: 70%;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

/* La palabra se tacha solo al pasar el mouse. */
.logo__word::after {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  top: 52%;
  height: 4px;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease-out);
}

.logo:hover .logo__word::after {
  transform: scaleX(1);
}

.logo__rest {
  font-size: 18px;
}

.nav {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.nav__link {
  position: relative;
  padding: 8px 12px;
  font-weight: 800;
  font-stretch: 88%;
  font-size: 14px;
  text-transform: uppercase;
  text-decoration: none;
  letter-spacing: 0.03em;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.nav__link:hover {
  background: var(--ink-10);
}

.nav__link.router-link-active {
  background: var(--ink);
  color: var(--paper);
}

.nav__count {
  font-size: 12px;
  font-weight: 400;
}

.nav__link--cta {
  border: var(--border);
  box-shadow: var(--shadow);
}

@media (max-width: 640px) {
  .logo__rest {
    display: none;
  }
  .nav__link {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
