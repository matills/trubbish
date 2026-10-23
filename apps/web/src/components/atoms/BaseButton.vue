<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'solid' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'solid', size: 'md', type: 'button' },
)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) {
    return /^https?:/.test(props.href) ? { href: props.href, target: '_blank', rel: 'noopener noreferrer' } : { href: props.href }
  }
  return { type: props.type, disabled: props.disabled || props.loading }
})
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'is-loading': loading }]"
    :aria-busy="loading || undefined"
  >
    <span class="btn__label"><slot /></span>
    <span v-if="loading" class="btn__reel" aria-hidden="true" />
  </component>
</template>

<style scoped>
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: var(--border);
  font-family: var(--font-display);
  font-weight: 800;
  font-stretch: 112%;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.14s var(--ease-out),
    box-shadow 0.14s var(--ease-out),
    background-color 0.2s,
    color 0.2s;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 12px;
}
.btn--md {
  padding: 12px 20px;
  font-size: 14px;
}
.btn--lg {
  padding: 18px 30px;
  font-size: 17px;
}

.btn--solid {
  background: var(--ink);
  color: var(--paper);
  box-shadow: var(--shadow);
}
.btn--outline {
  background: var(--paper);
  color: var(--ink);
  box-shadow: var(--shadow);
}
.btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.btn--solid:hover:not(:disabled),
.btn--outline:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}
.btn--solid:active:not(:disabled),
.btn--outline:active:not(:disabled) {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--ink);
}
.btn--ghost:hover {
  background: var(--ink);
  color: var(--paper);
  text-decoration: none;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

.is-loading .btn__label {
  opacity: 0.35;
}

/* Bobina girando mientras carga. */
.btn__reel {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background:
    radial-gradient(circle at 50% 22%, currentColor 0 2px, transparent 2.5px),
    radial-gradient(circle at 78% 62%, currentColor 0 2px, transparent 2.5px),
    radial-gradient(circle at 22% 62%, currentColor 0 2px, transparent 2.5px);
  animation: reel 0.8s steps(8) infinite;
}

@keyframes reel {
  to {
    transform: rotate(360deg);
  }
}
</style>
