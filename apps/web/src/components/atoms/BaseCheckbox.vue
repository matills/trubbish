<script setup lang="ts">
defineProps<{ label?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="check">
    <input v-model="model" type="checkbox" class="check__input" />
    <span class="check__box" aria-hidden="true" />
    <span v-if="label || $slots.default" class="check__label"><slot>{{ label }}</slot></span>
  </label>
</template>

<style scoped>
.check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.check__input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.check__box {
  flex: none;
  width: 20px;
  height: 20px;
  border: var(--border);
  background: var(--paper);
  display: grid;
  place-items: center;
  transition: background-color 0.12s;
}

.check__input:checked + .check__box {
  background: var(--ink);
}

.check__input:checked + .check__box::after {
  content: '';
  width: 10px;
  height: 5px;
  border-left: 3px solid var(--paper);
  border-bottom: 3px solid var(--paper);
  transform: translateY(-2px) rotate(-45deg);
}

.check__input:focus-visible + .check__box {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}
</style>
