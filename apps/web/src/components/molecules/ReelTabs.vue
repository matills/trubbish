<script setup lang="ts" generic="T extends string">
/** Pestañas numeradas como rollos de película. */
defineProps<{ options: { value: T; label: string; count?: number }[]; ariaLabel: string }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="(opt, i) in options"
      :key="opt.value"
      class="tab"
      role="tab"
      type="button"
      :aria-selected="model === opt.value"
      :class="{ 'is-active': model === opt.value }"
      @click="model = opt.value"
    >
      <span class="tab__no mono">{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="tab__label">{{ opt.label }}</span>
      <span v-if="opt.count !== undefined" class="tab__count mono">{{ opt.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  overflow-x: auto;
  border: var(--border);
  scrollbar-width: none;
}

.tab {
  position: relative;
  flex: 1 0 auto;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 16px;
  border: 0;
  border-right: var(--border);
  background: var(--paper);
  font-weight: 800;
  font-stretch: 90%;
  font-size: 14px;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.tab:last-child {
  border-right: 0;
}

/* Perforaciones de película arriba y abajo. */
.tab::before,
.tab::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  height: 4px;
  background: repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px);
  opacity: 0;
  transition: opacity 0.2s;
}

.tab::before {
  top: 3px;
}

.tab::after {
  bottom: 3px;
}

.tab:hover {
  background: var(--ink-10);
}

.tab.is-active {
  background: var(--ink);
  color: var(--paper);
}

.tab.is-active::before,
.tab.is-active::after {
  opacity: 1;
}

.tab__no,
.tab__count {
  font-size: 12px;
  font-weight: 400;
}

.tab__count {
  padding: 0 6px;
  border: 1px solid currentColor;
}
</style>
