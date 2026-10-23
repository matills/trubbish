import gsap from 'gsap'
import { isReducedMotion } from './reduced'

/**
 * Transición de iris entre rutas, estilo cine mudo: el cuadro se cierra en un
 * círculo hacia negro y se vuelve a abrir en la vista nueva, centrado donde
 * el usuario hizo click. El overlay lo monta IrisOverlay.vue.
 */
let overlay: HTMLElement | null = null
const origin = { x: 50, y: 50 }

const CLOSE_S = 0.5
const OPEN_S = 0.7

export function registerIrisOverlay(el: HTMLElement | null): void {
  overlay = el
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      origin.x = (e.clientX / window.innerWidth) * 100
      origin.y = (e.clientY / window.innerHeight) * 100
    },
    { passive: true },
  )
}

/**
 * La navegación nunca espera a la animación más de lo que dura: si el ticker
 * de GSAP está frenado (pestaña en segundo plano), se resuelve igual.
 */
function once(done: () => void, seconds: number): () => void {
  let called = false
  const finish = () => {
    if (called) return
    called = true
    clearTimeout(timer)
    done()
  }
  const timer = setTimeout(finish, seconds * 1000 + 250)
  return finish
}

// Vue rompe el reemplazo out-in si `done` se llama de forma sincrónica dentro del hook.
const deferred = (done: () => void) => void setTimeout(done)

export function irisClose(_el: Element, done: () => void): void {
  if (!overlay || isReducedMotion()) return deferred(done)
  const finish = once(done, CLOSE_S)
  gsap.killTweensOf(overlay)
  gsap.set(overlay, { '--x': `${origin.x}%`, '--y': `${origin.y}%`, '--r': '150vmax', autoAlpha: 1 })
  gsap.to(overlay, { '--r': '0vmax', duration: CLOSE_S, ease: 'power3.in', onComplete: finish })
}

export function irisOpen(_el: Element, done: () => void): void {
  if (!overlay || isReducedMotion()) return deferred(done)
  const el = overlay
  const finish = once(() => {
    gsap.killTweensOf(el)
    gsap.set(el, { '--r': '150vmax', autoAlpha: 0 })
    done()
  }, OPEN_S + 0.05)
  window.scrollTo(0, 0)
  gsap.set(el, { '--x': '50%', '--y': '45%' })
  gsap.to(el, { '--r': '150vmax', duration: OPEN_S, delay: 0.05, ease: 'power3.out', onComplete: finish })
}
