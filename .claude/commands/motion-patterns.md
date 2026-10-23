---
name: motion-patterns
description: Patrones de animación para el frontend Vue 3 con GSAP + Transition — composables de timeline, limpieza, reduced motion, transiciones de ruta (iris), tipeo, sello y split-flap, alineados a docs/DESIGN.md (retro años 60, blanco y negro).
origin: borrar
---

# Patrones de movimiento (Vue 3 + GSAP)

Leer `docs/DESIGN.md` § Movimiento antes de aplicar esto. Este skill dice **cómo** implementar; DESIGN.md dice **qué** se anima.

## Cuándo activar

- Al crear o modificar cualquier animación, transición de ruta o micro-interacción.
- Al revisar un `.vue` que importa `gsap`.

## 1. Una timeline = un composable

Toda animación no trivial vive en `src/composables/motion/useX.ts`, recibe refs de elementos y se limpia sola.

```ts
// src/composables/motion/useStamp.ts
import { onMounted, onUnmounted, type Ref } from 'vue'
import gsap from 'gsap'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

export function useStamp(target: Ref<HTMLElement | null>) {
  const reduced = usePrefersReducedMotion()
  let ctx: gsap.Context | undefined

  onMounted(() => {
    ctx = gsap.context(() => {}, target.value ?? undefined)
  })
  onUnmounted(() => ctx?.revert())

  function play(): Promise<void> {
    const el = target.value
    if (!el) return Promise.resolve()
    if (reduced.value) {
      gsap.set(el, { opacity: 1, scale: 1, rotate: -12 })
      return Promise.resolve()
    }
    return new Promise(resolve => {
      ctx?.add(() => {
        gsap.timeline({ onComplete: resolve })
          .fromTo(el, { scale: 2.4, opacity: 0, rotate: -4 }, { scale: 1, opacity: 1, rotate: -12, duration: 0.28, ease: 'power4.in' })
          .to(el.parentElement, { x: 3, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' })
      })
    })
  }

  return { play }
}
```

Reglas:
- `gsap.context()` + `ctx.revert()` en `onUnmounted` — siempre. Sin esto quedan tweens vivos al cambiar de ruta.
- Las funciones `play()` devuelven `Promise` para poder encadenar con la lógica (ej. marcar como borrada recién después del sello).
- El componente no conoce GSAP: solo llama `play()`.

## 2. Reduced motion es obligatorio

```ts
// src/composables/motion/usePrefersReducedMotion.ts
import { useMediaQuery } from '@vueuse/core'
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
```

Cada composable de movimiento tiene una rama `reduced` que deja el estado final (o un fundido de ≤150ms). Para CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

## 3. Transición de ruta (iris)

```vue
<!-- App.vue -->
<RouterView v-slot="{ Component }">
  <Transition :css="false" mode="out-in" @leave="irisClose" @enter="irisOpen">
    <component :is="Component" />
  </Transition>
</RouterView>
```

```ts
function irisClose(el: Element, done: () => void) {
  gsap.to('.iris', { clipPath: 'circle(0% at 50% 50%)', duration: 0.45, ease: 'power2.in', onComplete: done })
}
function irisOpen(el: Element, done: () => void) {
  gsap.fromTo('.iris', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: 0.6, ease: 'power3.out', onComplete: done })
}
```

La capa `.iris` es un overlay fijo de `--ink`; el contenido no se anima con `clip-path` directamente para no forzar repaints de toda la vista.

## 4. Listas que entran (fichas)

Para entradas/salidas de items usar `<TransitionGroup>` con hooks JS y `stagger` por índice (`data-index`). Para reordenamientos (filtrar por estado) usar `Flip` de GSAP:

```ts
import { Flip } from 'gsap/Flip'
gsap.registerPlugin(Flip)

const state = Flip.getState('.account-card')
applyFilter()                    // muta el estado reactivo
await nextTick()
Flip.from(state, { duration: 0.5, ease: 'power3.inOut', stagger: 0.03, absolute: true })
```

## 5. Tipeo y split-flap (mecánico)

- Tipeo: `steps(n)` sobre un `clip-path: inset(0 X 0 0)` o revelado carácter por carácter con `SplitText`; cursor con `steps(1)` en loop **solo mientras tipea**.
- Split-flap: cada dígito es un tambor con `rotateX`; `ease: 'steps(10)'` para sensación de persiana. Números en Courier Prime.

## 6. ScrollTrigger

- Solo en landing y pantallas narrativas, nunca en el tracker (herramienta de trabajo: nada se mueve al scrollear).
- Registrar dentro del `gsap.context()` del composable para que `revert()` mate los triggers.
- `ScrollTrigger.refresh()` después de que cargan fuentes (`document.fonts.ready`).

## 7. Performance

- Solo `transform`, `opacity`, `clip-path`, `font-variation-settings`.
- `will-change` solo durante la animación (GSAP lo maneja con `force3D`), nunca permanente en CSS.
- El overlay de grano es un único elemento fijo; su flicker es `steps()` sobre `background-position`, no re-render del SVG.
- Probar en throttling de CPU 4x: si cae de 50fps, simplificar.

## Checklist

- [ ] Animación en composable, con `ctx.revert()` en `onUnmounted`
- [ ] Rama `reduced` implementada
- [ ] Solo propiedades compositables
- [ ] No bloquea la interacción ni se repite en loop sobre contenido de lectura
- [ ] Coherente con la tabla de coreografías de `docs/DESIGN.md`
