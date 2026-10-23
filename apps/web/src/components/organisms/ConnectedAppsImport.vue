<script setup lang="ts">
import { computed, ref } from 'vue'
import { AccountSource } from '@borrar/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useCatalogStore } from '@/stores/catalog'
import { hostFrom } from '@/utils/browser-csv'

const accounts = useAccountsStore()
const catalog = useCatalogStore()

const PROVIDERS = [
  { name: 'Google', url: 'https://myaccount.google.com/connections', hint: 'Seguridad › Tus conexiones con apps y servicios de terceros' },
  { name: 'Facebook', url: 'https://www.facebook.com/settings/?tab=applications', hint: 'Configuración › Apps y sitios web' },
  { name: 'Apple', url: 'https://account.apple.com/', hint: 'Inicio de sesión y seguridad › Iniciar sesión con Apple' },
  { name: 'Microsoft', url: 'https://account.live.com/consent/Manage', hint: 'Privacidad › Apps y servicios con acceso' },
  { name: 'X / Twitter', url: 'https://x.com/settings/connected_apps', hint: 'Seguridad › Apps conectadas' },
  { name: 'GitHub', url: 'https://github.com/settings/applications', hint: 'Settings › Applications › Authorized OAuth Apps' },
]

const pasted = ref('')
const importing = ref(false)
const message = ref<string | null>(null)

/** Cada línea puede ser un dominio o el nombre del servicio tal como lo muestra Google o Facebook. */
const parsed = computed(() => {
  const lines = [...new Set(pasted.value.split(/\r?\n|,/).map((l) => l.trim()).filter(Boolean))]
  const known: { domain: string; name: string }[] = []
  const unknown: string[] = []
  for (const line of lines) {
    const service = catalog.match(line) ?? catalog.match(hostFrom(line) ?? '')
    const host = hostFrom(line)
    if (service) known.push({ domain: service.domain, name: service.name })
    else if (host) known.push({ domain: host, name: line })
    else unknown.push(line)
  }
  return { known, unknown }
})

async function importAll() {
  importing.value = true
  message.value = null
  try {
    const res = await accounts.bulk(AccountSource.CONNECTED_APPS, parsed.value.known)
    message.value = `Entraron ${res.created} cuentas${res.skipped ? ` · ${res.skipped} ya estaban` : ''}.`
    pasted.value = parsed.value.unknown.join('\n')
  } catch (err) {
    message.value = errorMessage(err)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="apps">
    <p>
      Las cuentas que abriste con un botón de «Entrar con Google» o «con Facebook» no tienen contraseña guardada en ningún
      lado. Cada proveedor muestra la lista: abrila, copiá los nombres y pegalos acá.
    </p>

    <ul class="providers">
      <li v-for="p in PROVIDERS" :key="p.name">
        <a :href="p.url" target="_blank" rel="noopener noreferrer" class="provider">
          <strong>{{ p.name }} ↗</strong>
          <span class="mono">{{ p.hint }}</span>
        </a>
      </li>
    </ul>

    <BaseInput
      v-model="pasted"
      label="Pegá los servicios, uno por línea"
      placeholder="Spotify&#10;Canva&#10;letterboxd.com"
      multiline
      :rows="6"
      mono
    />

    <div v-if="parsed.known.length || parsed.unknown.length" class="result mono">
      <p>
        <strong>{{ parsed.known.length }}</strong> reconocidos
        <template v-if="parsed.unknown.length">
          · <strong>{{ parsed.unknown.length }}</strong> sin reconocer ({{ parsed.unknown.slice(0, 4).join(', ') }}{{ parsed.unknown.length > 4 ? '…' : '' }}): escribí su dirección web.
        </template>
      </p>
    </div>
    <p v-if="message" class="mono" role="status">{{ message }}</p>

    <BaseButton :disabled="parsed.known.length === 0" :loading="importing" @click="importAll">
      Importar {{ parsed.known.length }} al expediente
    </BaseButton>
  </div>
</template>

<style scoped>
.apps {
  display: grid;
  gap: 20px;
  justify-items: start;
}

.apps > * {
  width: 100%;
}

.apps > :deep(.btn) {
  width: auto;
}

.providers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}

.provider {
  display: grid;
  gap: 4px;
  height: 100%;
  padding: 12px 14px;
  border: var(--border);
  text-decoration: none;
  transition:
    transform 0.15s var(--ease-out),
    box-shadow 0.15s var(--ease-out);
}

.provider:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow);
}

.provider strong {
  text-transform: uppercase;
  font-stretch: 90%;
}

.provider span {
  font-size: 12px;
  color: var(--ink-70);
}

.result {
  font-size: 14px;
  padding: 10px 14px;
  border: var(--border-dashed);
}
</style>
