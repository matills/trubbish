<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import TypewriterText from '@/components/atoms/TypewriterText.vue'
import CodeInput from '@/components/molecules/CodeInput.vue'
import { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const step = ref<'email' | 'code'>('email')
const email = ref('')
const code = ref('')
const devCode = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const codeError = ref(false)
const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function startTimer(seconds: number) {
  if (timer) clearInterval(timer)
  secondsLeft.value = seconds
  timer = setInterval(() => {
    secondsLeft.value = Math.max(0, secondsLeft.value - 1)
    if (secondsLeft.value === 0 && timer) clearInterval(timer)
  }, 1000)
}
onUnmounted(() => timer && clearInterval(timer))

async function sendCode() {
  loading.value = true
  error.value = null
  try {
    const res = await auth.requestCode(email.value)
    devCode.value = res.devCode ?? null
    startTimer(res.expiresInSeconds)
    step.value = 'code'
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

async function verify(value = code.value) {
  if (value.length !== 6 || loading.value) return
  loading.value = true
  error.value = null
  codeError.value = false
  try {
    await auth.verify(email.value, value)
    const back = typeof route.query['volver'] === 'string' && route.query['volver'].startsWith('/') ? route.query['volver'] : '/expediente'
    await router.push(back)
  } catch (err) {
    error.value = errorMessage(err)
    codeError.value = true
  } finally {
    loading.value = false
  }
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
</script>

<template>
  <section class="container login">
    <div class="telegram">
      <header class="telegram__head">
        <span class="eyebrow">Telegrama · Urgente</span>
        <span class="eyebrow">Verificación de titularidad</span>
      </header>

      <form v-if="step === 'email'" class="telegram__body" @submit.prevent="sendCode">
        <h1>¿Cuál es <span class="serif">tu</span> correo?</h1>
        <p>Te mandamos un código de 6 dígitos. Solo buscamos cuentas de un correo que demuestres controlar.</p>
        <BaseInput v-model="email" label="Correo" type="email" autocomplete="email" placeholder="yo@ejemplo.com" required mono :error="error" />
        <BaseButton type="submit" size="lg" :loading="loading">Enviar código</BaseButton>
        <p class="mono telegram__fine">No hay contraseña: el código es tu llave, cada vez.</p>
      </form>

      <form v-else class="telegram__body" @submit.prevent="verify()">
        <h1>Revisá <span class="serif">tu</span> bandeja</h1>
        <p>
          Mandamos el código a <strong class="mono">{{ email }}</strong>.
          <span v-if="secondsLeft > 0" class="mono">Vence en {{ mmss(secondsLeft) }}.</span>
          <span v-else class="mono">Venció: pedí otro.</span>
        </p>

        <div v-if="devCode" class="dev">
          <span class="eyebrow">Modo desarrollo · sin servidor de correo</span>
          <TypewriterText :text="`CÓDIGO ${devCode.split('').join(' ')}`" :cps="14" class="dev__code" />
        </div>

        <CodeInput v-model="code" :error="codeError" @complete="verify" />
        <p v-if="error" class="mono telegram__error" role="alert">{{ error }}</p>

        <div class="telegram__actions">
          <BaseButton type="submit" size="lg" :loading="loading" :disabled="code.length !== 6">Entrar</BaseButton>
          <BaseButton variant="ghost" @click="step = 'email'">Cambiar correo</BaseButton>
          <BaseButton variant="ghost" :disabled="loading" @click="sendCode">Reenviar</BaseButton>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login {
  display: grid;
  place-items: center;
  padding-top: 64px;
  padding-bottom: 64px;
}

.telegram {
  width: min(640px, 100%);
  border: 3px solid var(--ink);
  background: var(--paper);
  box-shadow: var(--shadow-lg);
  animation: arrive 0.6s var(--ease-out);
}

@keyframes arrive {
  from {
    transform: translateY(40px) rotate(-2deg);
    opacity: 0;
  }
}

.telegram__head {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 18px;
  background: var(--ink);
  color: var(--paper);
}

.telegram__body {
  display: grid;
  gap: 20px;
  padding: clamp(20px, 5vw, 40px);
  justify-items: start;
}

.telegram__body > :deep(.field) {
  width: 100%;
}

.telegram__body h1 {
  font-size: clamp(40px, 7vw, 64px);
  font-stretch: 75%;
}

.telegram__fine {
  font-size: 13px;
  color: var(--ink-70);
}

.dev {
  display: grid;
  gap: 6px;
  padding: 12px 16px;
  border: var(--border-dashed);
  width: 100%;
}

.dev__code {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.telegram__error {
  font-weight: 700;
}

.telegram__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
</style>
