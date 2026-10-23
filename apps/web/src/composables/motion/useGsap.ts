import { onMounted, onUnmounted, type Ref } from 'vue'
import gsap from 'gsap'
import { isReducedMotion } from './reduced'

/**
 * Contexto de GSAP atado al ciclo de vida del componente: todo lo que se crea
 * con `run` (tweens, timelines, ScrollTriggers) se revierte en onUnmounted.
 */
export function useGsap(scope?: Ref<HTMLElement | null>) {
  let ctx: gsap.Context | null = null

  onMounted(() => {
    ctx = gsap.context(() => {}, scope?.value ?? undefined)
  })
  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })

  /** Ejecuta `animate` dentro del contexto; con movimiento reducido corre `reduced` (o nada). */
  function run(animate: () => void, reduced?: () => void): void {
    const fn = isReducedMotion() ? reduced : animate
    if (!fn) return
    if (ctx) ctx.add(fn)
    else fn()
  }

  return { run }
}
