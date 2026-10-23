<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useRequestsStore } from '@/stores/requests'

const auth = useAuthStore()
const accounts = useAccountsStore()
const requests = useRequestsStore()
const { theme, motion } = storeToRefs(usePreferencesStore())
const router = useRouter()

const confirmText = ref('')
const deleting = ref(false)
const error = ref<string | null>(null)

/** Copia local de lo que guardamos de vos, armada en el navegador. */
async function exportData() {
  await Promise.all([accounts.fetchAll(), requests.fetchAll()])
  const data = { exportadoEl: new Date().toISOString(), correo: auth.user?.email, cuentas: accounts.accounts, pedidos: requests.requests }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'mi-expediente.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function logout() {
  await auth.logout()
  accounts.reset()
  requests.reset()
  await router.push({ name: 'landing' })
}

async function deleteEverything() {
  deleting.value = true
  error.value = null
  try {
    await auth.deleteEverything()
    accounts.reset()
    requests.reset()
    await router.push({ name: 'landing' })
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="container page">
    <header>
      <p class="eyebrow">{{ auth.user?.email }}</p>
      <h1>Ajustes</h1>
    </header>

    <section class="block">
      <h2>Pantalla</h2>
      <div class="toggle-row">
        <div>
          <strong>Negativo de película</strong>
          <p class="mono">Invierte papel y tinta.</p>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="theme === 'negative'"
          @click="theme = theme === 'negative' ? 'paper' : 'negative'"
        >
          <span class="switch__knob" />
        </button>
      </div>
      <div class="toggle-row">
        <div>
          <strong>Reducir movimiento</strong>
          <p class="mono">Sin iris, sin grano animado ni coreografías: fundidos cortos.</p>
        </div>
        <button type="button" class="switch" role="switch" :aria-checked="motion === 'reduced'" @click="motion = motion === 'reduced' ? 'full' : 'reduced'">
          <span class="switch__knob" />
        </button>
      </div>
    </section>

    <section class="block">
      <h2>Tus datos</h2>
      <p>Tu lista de cuentas, notas y pedidos se guardan cifrados. Nunca guardamos contraseñas.</p>
      <div class="actions">
        <BaseButton variant="outline" @click="exportData">Descargar mi expediente (JSON)</BaseButton>
        <BaseButton variant="outline" @click="logout">Cerrar sesión</BaseButton>
      </div>
    </section>

    <section class="block block--danger">
      <h2>Borrar todo</h2>
      <p>
        Elimina tu usuario, todas las fichas, escaneos y pedidos. No se puede deshacer. Las cuentas en cada servicio siguen
        existiendo: esto borra solo lo que guardamos nosotros.
      </p>
      <form class="danger" @submit.prevent="deleteEverything">
        <BaseInput v-model="confirmText" label="Escribí BORRAR para confirmar" mono autocomplete="off" />
        <BaseButton type="submit" :disabled="confirmText.trim().toUpperCase() !== 'BORRAR'" :loading="deleting">Borrar mi expediente</BaseButton>
      </form>
      <p v-if="error" class="mono" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 32px;
  padding-top: 48px;
  max-width: 860px;
}

h1 {
  font-size: clamp(56px, 10vw, 120px);
  font-stretch: 70%;
}

.block {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: var(--border);
}

.block h2 {
  font-size: 32px;
  font-stretch: 80%;
}

.block--danger {
  border-width: 3px;
  border-style: dashed;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--ink-40);
}

.toggle-row p {
  font-size: 13px;
  color: var(--ink-70);
}

.switch {
  position: relative;
  flex: none;
  width: 64px;
  height: 32px;
  border: var(--border);
  background: var(--paper);
  cursor: pointer;
}

.switch__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: var(--ink);
  transition: transform 0.25s var(--ease-out);
}

.switch[aria-checked='true'] {
  background-image: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 6px);
}

.switch[aria-checked='true'] .switch__knob {
  transform: translateX(32px);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.danger {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 12px;
}

@media (max-width: 560px) {
  .danger {
    grid-template-columns: 1fr;
  }
}
</style>
