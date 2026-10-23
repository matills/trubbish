<script setup lang="ts">
import type { CatalogEntry } from '@borrar/shared'
import DifficultyDots from '@/components/atoms/DifficultyDots.vue'
import { CATEGORY_LABEL } from '@/utils/labels'

defineProps<{ service: CatalogEntry; added: boolean; busy?: boolean }>()
const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <li class="row" :class="{ 'is-added': added }">
    <div class="row__name">
      <strong>{{ service.name }}</strong>
      <span class="mono">{{ service.domain }}</span>
    </div>
    <span class="row__cat mono">{{ CATEGORY_LABEL[service.category] }}</span>
    <DifficultyDots :difficulty="service.difficulty" show-label />
    <button class="row__add mono" type="button" :disabled="added || busy" @click="emit('add')">
      {{ added ? '✓ En el expediente' : '+ Agregar' }}
    </button>
  </li>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr) auto auto;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ink-40);
}

.row__name {
  display: grid;
  min-width: 0;
}

.row__name strong {
  font-size: 18px;
  font-stretch: 90%;
  text-transform: uppercase;
}

.row__name span,
.row__cat {
  font-size: 13px;
  color: var(--ink-70);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__add {
  padding: 6px 12px;
  border: var(--border);
  background: var(--paper);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
}

.row__add:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.is-added .row__add {
  border-style: dashed;
  cursor: default;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .row__cat {
    display: none;
  }
  .row > :deep(.dots) {
    grid-row: 2;
  }
}
</style>
