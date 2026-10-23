<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Law, type DeletionRequest, type RequestStatus, type TrackedAccount } from '@trubbish/shared'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import RequestCard from '@/components/molecules/RequestCard.vue'
import { errorMessage } from '@/services/api'
import { useRequestsStore } from '@/stores/requests'
import { LAW_LABEL } from '@/utils/labels'

const props = defineProps<{ account: TrackedAccount }>()
const store = useRequestsStore()
const { byAccount } = storeToRefs(store)

const law = ref<Law>(Law.AR_25326)
const fullName = ref('')
const documentId = ref('')
const recipient = ref(props.account.service?.privacyEmail ?? '')
const creating = ref(false)
const busyId = ref<number | null>(null)
const justCreated = ref<number | null>(null)
const error = ref<string | null>(null)

const requests = computed(() => byAccount.value.get(props.account.id) ?? [])

onMounted(() => store.fetchAll().catch((err) => (error.value = errorMessage(err))))

async function create() {
  creating.value = true
  error.value = null
  try {
    const req = await store.create({
      accountId: props.account.id,
      law: law.value,
      fullName: fullName.value,
      documentId: documentId.value || undefined,
      recipient: recipient.value || undefined,
    })
    justCreated.value = req.id
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    creating.value = false
  }
}

async function setStatus(req: DeletionRequest, status: RequestStatus) {
  busyId.value = req.id
  try {
    await store.setStatus(req.id, status)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    busyId.value = null
  }
}

async function remove(req: DeletionRequest) {
  try {
    await store.remove(req.id)
  } catch (err) {
    error.value = errorMessage(err)
  }
}
</script>

<template>
  <div class="composer">
    <form class="composer__form" @submit.prevent="create">
      <fieldset class="laws">
        <legend class="eyebrow">Ley aplicable</legend>
        <label v-for="(label, key) in LAW_LABEL" :key="key" class="law" :class="{ 'is-on': law === key }">
          <input v-model="law" class="sr-only" type="radio" name="law" :value="key" />
          {{ label }}
        </label>
      </fieldset>
      <BaseInput v-model="fullName" label="Tu nombre completo" autocomplete="name" required />
      <BaseInput v-if="law === Law.AR_25326" v-model="documentId" label="DNI (opcional)" hint="Ayuda a acreditar la identidad." mono />
      <BaseInput
        v-model="recipient"
        label="Correo de privacidad del servicio"
        type="email"
        :hint="account.service?.privacyEmail ? 'Lo tomamos del catálogo.' : 'Buscalo en la política de privacidad del sitio (suele ser privacy@ o datos@).'"
        mono
      />
      <p class="mono composer__note">El texto se guarda cifrado. Lo enviás vos desde tu correo: así queda constancia de que sos el titular.</p>
      <BaseButton type="submit" :loading="creating">Redactar el pedido</BaseButton>
      <p v-if="error" class="mono composer__error" role="alert">{{ error }}</p>
    </form>

    <div v-if="requests.length" class="composer__list">
      <RequestCard
        v-for="r in requests"
        :key="r.id"
        :request="r"
        :typed="r.id === justCreated"
        :busy="busyId === r.id"
        @status="(s) => setStatus(r, s)"
        @remove="remove(r)"
      />
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: grid;
  gap: 24px;
}

.composer__form {
  display: grid;
  gap: 16px;
  justify-items: start;
}

.composer__form > :deep(.field) {
  width: 100%;
}

.laws {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.laws legend {
  margin-bottom: 8px;
}

.law {
  padding: 10px 14px;
  border: var(--border);
  font-weight: 800;
  font-stretch: 88%;
  text-transform: uppercase;
  font-size: 14px;
  cursor: pointer;
}

.law.is-on {
  background: var(--ink);
  color: var(--paper);
}

.law:focus-within {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}

.composer__note {
  font-size: 13px;
  color: var(--ink-70);
}

.composer__error {
  padding: 10px 14px;
  border: 3px dashed var(--ink);
  font-weight: 700;
}

.composer__list {
  display: grid;
  gap: 16px;
}
</style>
