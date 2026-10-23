<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AccountStatus, Difficulty, SENSITIVE_CATEGORIES, type TrackedAccount } from '@borrar/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import DifficultyDots from '@/components/atoms/DifficultyDots.vue'
import RubberStamp from '@/components/atoms/RubberStamp.vue'
import StatusLabel from '@/components/atoms/StatusLabel.vue'
import ConfirmDialog from '@/components/molecules/ConfirmDialog.vue'
import RequestComposer from '@/components/organisms/RequestComposer.vue'
import { ApiError, errorMessage } from '@/services/api'
import { useAccountsStore } from '@/stores/accounts'
import { CATEGORY_LABEL, SOURCE_LABEL, STATUS_LABEL, formatDate } from '@/utils/labels'

const route = useRoute()
const router = useRouter()
const store = useAccountsStore()

const id = computed(() => Number(route.params['id']))
const account = ref<TrackedAccount | null>(null)
const notes = ref('')
const savingNotes = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)
const confirmSensitive = ref(false)
const confirmRemove = ref(false)

const service = computed(() => account.value?.service ?? null)
const needsLegal = computed(
  () => !service.value?.deleteUrl || service.value.difficulty === Difficulty.HARD || service.value.difficulty === Difficulty.IMPOSSIBLE,
)
const sensitive = computed(() => !!service.value && SENSITIVE_CATEGORIES.includes(service.value.category))
const recoveryUrl = computed(() => service.value?.recoveryUrl ?? (account.value ? `https://${account.value.domain}` : null))

onMounted(async () => {
  try {
    account.value = await store.fetchOne(id.value)
    notes.value = account.value.notes ?? ''
  } catch (err) {
    error.value = errorMessage(err)
  }
})

// Mantiene la ficha al día si el estado cambia desde un pedido legal.
watch(
  () => store.byId(id.value),
  (fresh) => {
    if (fresh) account.value = fresh
  },
)

async function setStatus(status: AccountStatus, confirm = false) {
  if (!account.value) return
  busy.value = true
  error.value = null
  try {
    account.value = await store.update(account.value.id, { status, confirmSensitive: confirm })
    confirmSensitive.value = false
  } catch (err) {
    if (err instanceof ApiError && err.code === 'SENSITIVE_CONFIRMATION_REQUIRED') confirmSensitive.value = true
    else error.value = errorMessage(err)
  } finally {
    busy.value = false
  }
}

async function saveNotes() {
  if (!account.value) return
  savingNotes.value = true
  try {
    account.value = await store.update(account.value.id, { notes: notes.value })
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    savingNotes.value = false
  }
}

async function remove() {
  if (!account.value) return
  await store.remove(account.value.id)
  await router.push({ name: 'dossier' })
}
</script>

<template>
  <div class="container page">
    <BaseButton variant="ghost" :to="{ name: 'dossier' }">← Volver al expediente</BaseButton>
    <p v-if="error" class="mono page__error" role="alert">{{ error }}</p>

    <article v-if="account" class="file" :class="{ 'is-deleted': account.status === AccountStatus.DELETED }">
      <header class="file__head">
        <div class="file__tab mono">FICHA N.º {{ String(account.id).padStart(4, '0') }}</div>
        <div class="file__title">
          <h1>{{ account.name }}</h1>
          <a class="mono" :href="`https://${account.domain}`" target="_blank" rel="noopener noreferrer">{{ account.domain }} ↗</a>
        </div>
        <RubberStamp class="file__stamp" text="BORRADA" :stamped="account.status === AccountStatus.DELETED" :size="150" />
      </header>

      <dl class="file__facts mono">
        <div><dt>Estado</dt><dd><StatusLabel :status="account.status" /></dd></div>
        <div><dt>Origen</dt><dd>{{ SOURCE_LABEL[account.source] }}</dd></div>
        <div v-if="service"><dt>Rubro</dt><dd>{{ CATEGORY_LABEL[service.category] }}</dd></div>
        <div v-if="service"><dt>Dificultad</dt><dd><DifficultyDots :difficulty="service.difficulty" show-label /></dd></div>
        <div><dt>Agregada</dt><dd>{{ formatDate(account.createdAt) }}</dd></div>
        <div v-if="account.closedAt"><dt>Cerrada</dt><dd>{{ formatDate(account.closedAt) }}</dd></div>
      </dl>

      <section class="file__section">
        <h2><span class="file__no">A</span> Cómo borrarla</h2>
        <p v-if="sensitive" class="file__warn mono">
          Rubro sensible. Antes de borrar, bajá comprobantes y confirmá que no tenés saldo, deudas ni trámites abiertos.
        </p>
        <p v-if="service?.steps" class="file__steps">{{ service.steps }}</p>
        <p v-else-if="!service" class="file__steps">
          Este servicio no está en el catálogo. Buscá en su sitio «eliminar cuenta» o «cerrar cuenta» en la configuración; si no
          aparece, mandá un pedido legal.
        </p>
        <div class="file__links">
          <BaseButton v-if="service?.deleteUrl" :href="service.deleteUrl" size="lg">Ir a borrar ↗</BaseButton>
          <BaseButton v-if="recoveryUrl" :href="recoveryUrl" variant="outline">¿Sin acceso? Recuperar ↗</BaseButton>
        </div>
      </section>

      <section class="file__section">
        <h2><span class="file__no">B</span> Marcar el estado</h2>
        <div class="file__status">
          <BaseButton
            v-for="s in [AccountStatus.TO_REVIEW, AccountStatus.IN_PROGRESS, AccountStatus.KEEP, AccountStatus.DELETED]"
            :key="s"
            :variant="account.status === s ? 'solid' : 'outline'"
            size="sm"
            :disabled="busy || account.status === s"
            @click="setStatus(s)"
          >
            {{ STATUS_LABEL[s] }}
          </BaseButton>
        </div>
        <form class="file__notes" @submit.prevent="saveNotes">
          <BaseInput v-model="notes" label="Notas (se guardan cifradas)" multiline :rows="3" placeholder="Pedí el borrado el lunes, me contestaron que tarda 30 días…" />
          <BaseButton type="submit" variant="outline" size="sm" :loading="savingNotes">Guardar notas</BaseButton>
        </form>
      </section>

      <section class="file__section" :class="{ 'is-highlight': needsLegal }">
        <h2><span class="file__no">C</span> Pedido legal de supresión</h2>
        <p>
          <template v-if="needsLegal">Este servicio no ofrece un borrado simple: el pedido formal es la vía.</template>
          <template v-else>Si el botón de borrar no funciona o no te contestan, usá el pedido formal.</template>
          La Ley 25.326 (Argentina) y el RGPD (Unión Europea) te dan derecho a exigir la supresión de tus datos.
        </p>
        <RequestComposer :account="account" />
      </section>

      <footer class="file__foot">
        <BaseButton variant="ghost" @click="confirmRemove = true">Sacar del expediente</BaseButton>
      </footer>
    </article>

    <ConfirmDialog
      :open="confirmSensitive"
      :title="`¿Ya no necesitás ${account?.name ?? ''}?`"
      confirm-label="Sí, está borrada"
      :busy="busy"
      @cancel="confirmSensitive = false"
      @confirm="setStatus(AccountStatus.DELETED, true)"
    >
      <p>Es una cuenta de un rubro sensible. Confirmá que ya la cerraste y que no la vas a necesitar.</p>
    </ConfirmDialog>

    <ConfirmDialog
      :open="confirmRemove"
      title="¿Sacar esta ficha?"
      confirm-label="Sacarla"
      @cancel="confirmRemove = false"
      @confirm="remove"
    >
      <p>Se borra del expediente junto con sus pedidos. La cuenta en el servicio sigue existiendo.</p>
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 24px;
  padding-top: 32px;
  justify-items: start;
}

.page > * {
  width: 100%;
}

.page > :deep(.btn--ghost) {
  width: auto;
}

.page__error {
  padding: 10px 14px;
  border: 3px dashed var(--ink);
  font-weight: 700;
}

.file {
  position: relative;
  display: grid;
  border: 3px solid var(--ink);
  box-shadow: var(--shadow-lg);
  background: var(--paper);
}

.file__head {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 48px clamp(18px, 4vw, 40px) 28px;
  border-bottom: 3px solid var(--ink);
}

/* La pestaña de la carpeta de archivo. */
.file__tab {
  position: absolute;
  top: -3px;
  left: clamp(18px, 4vw, 40px);
  padding: 6px 14px;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.file__title h1 {
  font-size: clamp(48px, 9vw, 110px);
  font-stretch: 68%;
  overflow-wrap: anywhere;
}

.file__stamp {
  position: absolute;
  right: clamp(16px, 4vw, 48px);
  top: 50%;
  translate: 0 -50%;
}

.file__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin: 0;
  border-bottom: 3px solid var(--ink);
}

.file__facts > div {
  padding: 14px clamp(18px, 4vw, 40px);
  border-right: 1px solid var(--ink-40);
  border-bottom: 1px solid var(--ink-40);
}

.file__facts dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-70);
}

.file__facts dd {
  margin: 4px 0 0;
  font-weight: 700;
}

.file__section {
  display: grid;
  gap: 16px;
  padding: 32px clamp(18px, 4vw, 40px);
  border-bottom: var(--border);
}

.file__section.is-highlight {
  background-image: repeating-linear-gradient(-45deg, var(--ink-10) 0 2px, transparent 2px 12px);
}

.file__section h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: clamp(26px, 4vw, 40px);
  font-stretch: 80%;
}

.file__no {
  display: grid;
  place-items: center;
  width: 1.3em;
  height: 1.3em;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.7em;
}

.file__section > p {
  max-width: 66ch;
}

.file__steps {
  font-size: 19px;
}

.file__warn {
  padding: 12px 16px;
  border: 3px solid var(--ink);
  font-weight: 700;
}

.file__links,
.file__status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.file__notes {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.file__notes > :deep(.field) {
  width: 100%;
}

.file__foot {
  padding: 16px clamp(18px, 4vw, 40px);
}

@media (max-width: 640px) {
  .file__stamp {
    top: 8px;
    translate: 0 0;
    width: 96px;
    height: 96px;
  }
}
</style>
