<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label: string
    type?: string
    placeholder?: string
    hint?: string
    error?: string | null
    mono?: boolean
    autocomplete?: string
    required?: boolean
    multiline?: boolean
    rows?: number
  }>(),
  { type: 'text', rows: 4 },
)

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="field" :class="{ 'has-error': error }">
    <label :for="id" class="field__label eyebrow">{{ label }}</label>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      class="field__control"
      :class="{ mono }"
      :rows="rows"
      :placeholder="placeholder"
      :required="required"
      :aria-invalid="!!error || undefined"
      :aria-describedby="hint || error ? `${id}-help` : undefined"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      class="field__control"
      :class="{ mono }"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="!!error || undefined"
      :aria-describedby="hint || error ? `${id}-help` : undefined"
    />
    <p v-if="error || hint" :id="`${id}-help`" class="field__help mono" :role="error ? 'alert' : undefined">
      {{ error ?? hint }}
    </p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field__control {
  width: 100%;
  padding: 14px 16px;
  border: var(--border);
  background: var(--paper);
  font-size: 18px;
  border-radius: 0;
  box-shadow: inset 3px 3px 0 var(--ink-10);
  transition: box-shadow 0.15s var(--ease-out);
  resize: vertical;
}

.field__control::placeholder {
  color: var(--ink-40);
}

.field__control:focus {
  outline: none;
  box-shadow: var(--shadow);
}

.field__help {
  font-size: 13px;
  color: var(--ink-70);
}

.has-error .field__control {
  border-style: dashed;
  border-width: 3px;
}

.has-error .field__help {
  color: var(--ink);
  font-weight: 700;
}

.has-error .field__help::before {
  content: '✕ ';
}
</style>
