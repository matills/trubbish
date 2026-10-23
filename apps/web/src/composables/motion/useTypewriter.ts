import { onUnmounted, ref, watch, type Ref } from 'vue'
import { isReducedMotion } from './reduced'

/** Revela `source` carácter por carácter, a ritmo de máquina de escribir. */
export function useTypewriter(source: Ref<string>, charsPerSecond = 60) {
  const shown = ref('')
  const typing = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
    typing.value = false
  }

  function finish() {
    stop()
    shown.value = source.value
  }

  function start(text: string) {
    stop()
    if (isReducedMotion() || !text) {
      shown.value = text
      return
    }
    shown.value = ''
    typing.value = true
    let i = 0
    // Varios caracteres por tick en textos largos, para que una carta no tarde un minuto.
    const step = Math.max(1, Math.round(text.length / (charsPerSecond * 4)))
    timer = setInterval(() => {
      i = Math.min(text.length, i + step)
      shown.value = text.slice(0, i)
      if (i >= text.length) stop()
    }, 1000 / charsPerSecond)
  }

  watch(source, start, { immediate: true })
  onUnmounted(stop)

  return { shown, typing, finish }
}
