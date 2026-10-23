<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'rings' | 'stripes' | 'moire'; animated?: boolean }>(), {
  variant: 'rings',
  animated: true,
})
</script>

<template>
  <div class="op" :class="[`op--${variant}`, { 'is-animated': animated }]" aria-hidden="true">
    <span class="op__layer" />
    <span v-if="variant === 'moire'" class="op__layer op__layer--b" />
  </div>
</template>

<style scoped>
.op {
  position: relative;
  overflow: hidden;
  pointer-events: none;
}

.op__layer {
  position: absolute;
  inset: -40%;
}

.op--rings .op__layer,
.op--moire .op__layer {
  background: repeating-radial-gradient(circle at center, var(--ink) 0 4px, transparent 4px 14px);
}

.op--stripes .op__layer {
  background: repeating-linear-gradient(90deg, var(--ink) 0 6px, transparent 6px 16px);
}

/* Dos capas de anillos con centros distintos: el moiré de Bridget Riley. */
.op--moire .op__layer--b {
  background: repeating-radial-gradient(circle at 58% 46%, var(--ink) 0 4px, transparent 4px 14px);
}

.is-animated.op--rings .op__layer {
  animation: pulse 3.2s ease-in-out infinite alternate;
}

.is-animated.op--stripes .op__layer {
  animation: drift 2.4s linear infinite;
}

.is-animated.op--moire .op__layer--b {
  animation: orbit 4s linear infinite;
}

@keyframes pulse {
  to {
    transform: scale(1.18);
  }
}

@keyframes drift {
  to {
    transform: translateX(16px);
  }
}

@keyframes orbit {
  0% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(6%, 3%) scale(1.04); }
  50% { transform: translate(0, 7%) scale(1.08); }
  75% { transform: translate(-6%, 3%) scale(1.04); }
  100% { transform: translate(0, 0) scale(1); }
}
</style>
