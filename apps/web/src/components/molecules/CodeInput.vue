<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const LENGTH = 6
const props = defineProps<{ error?: boolean }>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [code: string] }>()

const cells = ref<HTMLInputElement[]>([])
const digits = ref<string[]>(Array.from({ length: LENGTH }, (_, i) => model.value[i] ?? ''))

watch(digits, (d) => {
  const code = d.join('')
  model.value = code
  if (code.length === LENGTH) emit('complete', code)
}, { deep: true })

watch(
  () => props.error,
  async (err) => {
    if (!err) return
    digits.value = Array(LENGTH).fill('')
    await nextTick()
    cells.value[0]?.focus()
  },
)

function onInput(i: number, e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  if (value.length > 1) return fill(i, value)
  digits.value[i] = value
  if (value && i < LENGTH - 1) cells.value[i + 1]?.focus()
}

function fill(start: number, value: string) {
  const next = [...digits.value]
  value
    .slice(0, LENGTH - start)
    .split('')
    .forEach((c, k) => (next[start + k] = c))
  digits.value = next
  cells.value[Math.min(LENGTH - 1, start + value.length)]?.focus()
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) cells.value[i - 1]?.focus()
  if (e.key === 'ArrowLeft' && i > 0) cells.value[i - 1]?.focus()
  if (e.key === 'ArrowRight' && i < LENGTH - 1) cells.value[i + 1]?.focus()
}

function onPaste(i: number, e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text')?.replace(/\D/g, '')
  if (!text) return
  e.preventDefault()
  fill(i, text)
}

onMounted(() => cells.value[0]?.focus())
</script>

<template>
  <div class="code" :class="{ 'has-error': error }" role="group" aria-label="Código de 6 dígitos">
    <input
      v-for="(_, i) in digits"
      :key="i"
      :ref="(el) => (cells[i] = el as HTMLInputElement)"
      :value="digits[i]"
      class="code__cell"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="6"
      :aria-label="`Dígito ${i + 1}`"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
    />
  </div>
</template>

<style scoped>
.code {
  display: flex;
  gap: clamp(6px, 1.5vw, 12px);
}

.code__cell {
  width: clamp(42px, 11vw, 64px);
  aspect-ratio: 3 / 4;
  border: var(--border);
  background: var(--paper);
  text-align: center;
  font-family: var(--font-mono);
  font-size: clamp(26px, 6vw, 40px);
  font-weight: 700;
  border-radius: 0;
  transition:
    transform 0.12s var(--ease-out),
    box-shadow 0.12s var(--ease-out);
}

.code__cell:focus {
  outline: none;
  box-shadow: var(--shadow);
  transform: translateY(-3px);
}

.has-error {
  animation: shake 0.4s steps(6);
}

.has-error .code__cell {
  border-style: dashed;
}

@keyframes shake {
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}
</style>
