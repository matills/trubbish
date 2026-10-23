<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

const props = withDefaults(
  defineProps<{ open: boolean; title: string; confirmLabel?: string; busy?: boolean }>(),
  { confirmLabel: 'Confirmar' },
)
const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (open && !dialog.value?.open) dialog.value?.showModal()
    if (!open && dialog.value?.open) dialog.value.close()
  },
)
</script>

<template>
  <dialog ref="dialog" class="dialog" @cancel.prevent="emit('cancel')" @close="emit('cancel')">
    <div class="dialog__body">
      <p class="eyebrow">Atención</p>
      <h2>{{ title }}</h2>
      <div class="dialog__text"><slot /></div>
      <div class="dialog__actions">
        <BaseButton variant="outline" @click="emit('cancel')">Cancelar</BaseButton>
        <BaseButton :loading="busy" @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  max-width: min(520px, calc(100vw - 32px));
  padding: 0;
  border: 3px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  box-shadow: var(--shadow-lg);
}

.dialog::backdrop {
  background: repeating-linear-gradient(-45deg, var(--ink-70) 0 3px, var(--ink-40) 3px 7px);
}

.dialog[open] {
  animation: drop 0.35s var(--ease-out);
}

@keyframes drop {
  from {
    transform: translateY(-24px) rotate(-1deg);
    opacity: 0;
  }
}

.dialog__body {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.dialog__body h2 {
  font-size: 30px;
  font-stretch: 80%;
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
