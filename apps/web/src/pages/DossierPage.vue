<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import BaseButton from '@/components/atoms/BaseButton.vue'
import OpArt from '@/components/atoms/OpArt.vue'
import ProgressFile from '@/components/molecules/ProgressFile.vue'
import StatTile from '@/components/molecules/StatTile.vue'
import AccountGrid from '@/components/organisms/AccountGrid.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'

const store = useAccountsStore()
const { counts, loaded, accounts } = storeToRefs(store)
const { user } = storeToRefs(useAuthStore())
const error = ref<string | null>(null)

const closed = computed(() => counts.value.total > 0 && counts.value.byStatus.TO_REVIEW + counts.value.byStatus.IN_PROGRESS === 0)

onMounted(() => store.fetchAll().catch((err) => (error.value = errorMessage(err))))
</script>

<template>
  <div class="container page">
    <header class="page__head">
      <div>
        <p class="eyebrow">Expediente de {{ user?.email }}</p>
        <h1>Tus <span class="serif">cuentas</span></h1>
      </div>
      <BaseButton :to="{ name: 'discover' }">+ Descubrir más</BaseButton>
    </header>

    <p v-if="error" class="mono" role="alert">{{ error }}</p>

    <template v-if="loaded && accounts.length">
      <div class="stats">
        <StatTile label="En el expediente" :value="counts.total" />
        <StatTile label="Por revisar" :value="counts.byStatus.TO_REVIEW" />
        <StatTile label="En proceso" :value="counts.byStatus.IN_PROGRESS" />
        <StatTile label="Borradas" :value="counts.byStatus.DELETED" inverted />
      </div>
      <ProgressFile :ratio="counts.closeRate" label="Tasa de cierre (sin contar las que conservás)" />

      <div v-if="closed" class="credits">
        <p class="eyebrow">Caso cerrado</p>
        <p class="credits__fin serif">Fin</p>
        <p class="mono">Revisaste todo tu expediente. Volvé cada tanto: siempre aparece alguna cuenta nueva.</p>
      </div>

      <AccountGrid />
    </template>

    <section v-else-if="loaded" class="empty">
      <OpArt class="empty__op" variant="stripes" />
      <div class="empty__box">
        <p class="eyebrow">Expediente vacío</p>
        <h2>Todavía no hay <span class="serif">fichas</span></h2>
        <p>Empezá por el catálogo o importá las contraseñas que guardó tu navegador: es donde más cuentas aparecen.</p>
        <BaseButton :to="{ name: 'discover' }" size="lg">Descubrir cuentas</BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 32px;
  padding-top: 48px;
}

.page__head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  flex-wrap: wrap;
  gap: 16px;
}

.page__head h1 {
  font-size: clamp(56px, 10vw, 120px);
  font-stretch: 70%;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 16px;
}

.credits {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 40px 16px;
  background: var(--ink);
  color: var(--paper);
  text-align: center;
  animation: credits 1.2s var(--ease-out);
}

.credits__fin {
  font-size: clamp(80px, 14vw, 160px);
  line-height: 0.85;
}

@keyframes credits {
  from {
    clip-path: circle(0% at 50% 50%);
  }
  to {
    clip-path: circle(100% at 50% 50%);
  }
}

.empty {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 460px;
  border: var(--border);
  overflow: hidden;
}

.empty__op {
  position: absolute;
  inset: 0;
  opacity: 0.6;
}

.empty__box {
  position: relative;
  display: grid;
  gap: 16px;
  justify-items: start;
  max-width: 520px;
  margin: 16px;
  padding: 32px;
  background: var(--paper);
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
}

.empty__box h2 {
  font-size: clamp(36px, 6vw, 56px);
  font-stretch: 75%;
}
</style>
