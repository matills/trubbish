<script setup lang="ts">
import { computed, ref } from 'vue'
import { AccountSource } from '@trubbish/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseCheckbox from '@/components/atoms/BaseCheckbox.vue'
import { errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { useCatalogStore } from '@/stores/catalog'
import { parseBrowserExport, type BrowserSite } from '@/utils/browser-csv'

const MAX_BYTES = 10 * 1024 * 1024

const accounts = useAccountsStore()
const catalog = useCatalogStore()

const browser = ref<'chrome' | 'firefox' | 'safari' | 'edge'>('chrome')
const sites = ref<(BrowserSite & { selected: boolean })[]>([])
const stats = ref<{ rows: number; ignored: number } | null>(null)
const error = ref<string | null>(null)
const result = ref<string | null>(null)
const importing = ref(false)
const dragging = ref(false)

const HOWTO: Record<typeof browser.value, { name: string; steps: string }> = {
  chrome: { name: 'Chrome', steps: 'Menú ⋮ › Contraseñas y autocompletar › Administrador de contraseñas de Google › Configuración › Exportar contraseñas.' },
  firefox: { name: 'Firefox', steps: 'Escribí about:logins en la barra › menú ⋯ › Exportar contraseñas.' },
  safari: { name: 'Safari', steps: 'En la Mac: Archivo › Exportar › Contraseñas. También desde la app Contraseñas › Archivo › Exportar.' },
  edge: { name: 'Edge', steps: 'Configuración › Perfiles › Contraseñas › ⋯ › Exportar contraseñas.' },
}

const selectedCount = computed(() => sites.value.filter((s) => s.selected).length)
const matched = (host: string) => catalog.match(host)

async function readFile(file: File | undefined) {
  error.value = null
  result.value = null
  if (!file) return
  if (file.size > MAX_BYTES) {
    error.value = 'El archivo es demasiado grande para ser un export del navegador.'
    return
  }
  try {
    // El archivo se lee acá y no se sube: solo viajan los dominios que elijas.
    const parsed = parseBrowserExport(await file.text())
    stats.value = { rows: parsed.rows, ignored: parsed.ignored }
    sites.value = parsed.sites
      .filter((s) => !accounts.domains.has(matched(s.host)?.domain ?? s.host))
      .map((s) => ({ ...s, selected: true }))
  } catch (err) {
    error.value = errorMessage(err)
    sites.value = []
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false
  void readFile(e.dataTransfer?.files[0])
}

function toggleAll(on: boolean) {
  sites.value = sites.value.map((s) => ({ ...s, selected: on }))
}

async function importSelected() {
  importing.value = true
  error.value = null
  try {
    const items = sites.value.filter((s) => s.selected).map((s) => ({ domain: s.host, name: s.name ?? undefined }))
    const res = await accounts.bulk(AccountSource.BROWSER, items)
    result.value = `Entraron ${res.created} cuentas al expediente${res.skipped ? ` (${res.skipped} ya estaban o no eran sitios)` : ''}. Ya podés borrar el CSV de tu computadora.`
    sites.value = []
    stats.value = null
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="import">
    <aside class="notice">
      <strong class="eyebrow">Tu archivo no sale de esta computadora</strong>
      <p>
        Leemos el CSV acá mismo, en el navegador, y tomamos solo la columna de sitios. Usuarios y contraseñas se descartan sin
        enviarse. Cuando termines, borrá el archivo: tiene tus contraseñas en texto plano.
      </p>
    </aside>

    <div class="howto">
      <div class="howto__tabs" role="group" aria-label="Navegador">
        <button
          v-for="(info, key) in HOWTO"
          :key="key"
          type="button"
          class="howto__tab"
          :class="{ 'is-on': browser === key }"
          :aria-pressed="browser === key"
          @click="browser = key"
        >
          {{ info.name }}
        </button>
      </div>
      <p class="mono howto__steps">{{ HOWTO[browser].steps }}</p>
    </div>

    <label
      class="drop"
      :class="{ 'is-dragging': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <input class="sr-only" type="file" accept=".csv,text/csv" @change="readFile(($event.target as HTMLInputElement).files?.[0])" />
      <span class="drop__icon" aria-hidden="true" />
      <span class="drop__title">Soltá el CSV acá</span>
      <span class="mono">o hacé click para elegirlo</span>
    </label>

    <p v-if="error" class="msg msg--error mono" role="alert">{{ error }}</p>
    <p v-if="result" class="msg mono" role="status">{{ result }}</p>

    <div v-if="stats" class="preview">
      <div class="preview__head">
        <p class="mono">
          {{ stats.rows }} filas · {{ sites.length }} sitios nuevos · {{ stats.ignored }} sin sitio web
        </p>
        <div class="preview__bulk">
          <BaseButton variant="ghost" size="sm" @click="toggleAll(true)">Todos</BaseButton>
          <BaseButton variant="ghost" size="sm" @click="toggleAll(false)">Ninguno</BaseButton>
        </div>
      </div>
      <ul class="preview__list">
        <li v-for="s in sites" :key="s.host">
          <BaseCheckbox v-model="s.selected">
            <span class="mono">{{ s.host }}</span>
            <strong v-if="matched(s.host)" class="preview__match"> → {{ matched(s.host)?.name }}</strong>
          </BaseCheckbox>
        </li>
      </ul>
      <BaseButton :disabled="selectedCount === 0" :loading="importing" @click="importSelected">
        Importar {{ selectedCount }} al expediente
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.import {
  display: grid;
  gap: 20px;
}

.notice {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  background: var(--ink);
  color: var(--paper);
}

.howto {
  display: grid;
  gap: 10px;
}

.howto__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.howto__tab {
  padding: 6px 12px;
  border: var(--border);
  background: var(--paper);
  font-weight: 800;
  text-transform: uppercase;
  font-size: 13px;
  cursor: pointer;
}

.howto__tab.is-on {
  background: var(--ink);
  color: var(--paper);
}

.howto__steps {
  font-size: 15px;
}

.drop {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 40px 16px;
  border: 3px dashed var(--ink);
  cursor: pointer;
  text-align: center;
  transition:
    background-color 0.2s,
    transform 0.2s var(--ease-out);
}

.drop:hover,
.drop.is-dragging {
  background-image: repeating-linear-gradient(-45deg, var(--ink-10) 0 6px, transparent 6px 14px);
}

.drop.is-dragging {
  transform: scale(1.01);
}

.drop:focus-within {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}

.drop__icon {
  width: 48px;
  height: 60px;
  border: var(--border);
  background: linear-gradient(var(--ink), var(--ink)) 50% 30% / 60% 2px no-repeat,
    linear-gradient(var(--ink), var(--ink)) 50% 50% / 60% 2px no-repeat,
    linear-gradient(var(--ink), var(--ink)) 50% 70% / 40% 2px no-repeat;
}

.drop__title {
  font-size: 24px;
  font-weight: 900;
  font-stretch: 80%;
  text-transform: uppercase;
}

.msg {
  padding: 10px 14px;
  border: var(--border);
}

.msg--error {
  border: 3px dashed var(--ink);
  font-weight: 700;
}

.preview {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: var(--border);
  box-shadow: var(--shadow);
}

.preview__head {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.preview__bulk {
  display: flex;
  gap: 4px;
}

.preview__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 8px 16px;
  max-height: 360px;
  overflow-y: auto;
}

.preview__match {
  font-size: 14px;
}
</style>
