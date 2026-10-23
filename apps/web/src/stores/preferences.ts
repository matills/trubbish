import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type Theme = 'paper' | 'negative'
type Motion = 'full' | 'reduced'

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* modo privado: la preferencia dura la sesión */
  }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const systemReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const theme = ref<Theme>(read('bmvd:theme', ['paper', 'negative'], 'paper'))
  const motion = ref<Motion>(read('bmvd:motion', ['full', 'reduced'], systemReduced ? 'reduced' : 'full'))

  watch(
    theme,
    (t) => {
      document.documentElement.dataset['theme'] = t
      write('bmvd:theme', t)
    },
    { immediate: true },
  )
  watch(
    motion,
    (m) => {
      document.documentElement.dataset['motion'] = m
      write('bmvd:motion', m)
    },
    { immediate: true },
  )

  return { theme, motion }
})
