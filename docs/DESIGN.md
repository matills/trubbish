# DESIGN.md — Borrar mi vida digital

> Referencia de diseño activa. **Leer antes de tocar cualquier `.vue` o CSS.**
> Si el doc y el código discrepan, gana el código y se corrige el doc.

## Dirección

**Retro años 60, estrictamente en blanco y negro, con mucho movimiento.**
Referencias: títulos de Saul Bass (formas recortadas en papel que entran y salen de cuadro), op-art de Bridget Riley y Victor Vasarely (rayas, círculos concéntricos, moiré), carteles del estilo suizo internacional, tapas de Blue Note, cine en blanco y negro (contador de película, iris, grano), máquinas de escribir y sellos de goma de oficina.

La metáfora del producto: **un expediente de oficina de 1964.** Cada cuenta es una ficha; borrarla es sellarla. Los pedidos legales se tipean a máquina.

## Color

Solo blanco y negro. Nada de acentos, nada de colores semánticos.

```css
:root {
  --paper: #f2efe8;      /* fondo: papel envejecido, no blanco puro */
  --ink: #0d0d0d;        /* tinta: texto, bordes, rellenos */
  --ink-70: rgb(13 13 13 / .7);
  --ink-40: rgb(13 13 13 / .4);
  --ink-10: rgb(13 13 13 / .1);
}
[data-theme="negative"] {  /* modo "negativo de película": se invierte, no se rediseña */
  --paper: #0d0d0d;
  --ink: #f2efe8;
}
```

- Siempre tokens, nunca hex sueltos en componentes.
- Los grises solo como transparencia de `--ink`, para texto secundario y separadores.
- **El estado se comunica con forma y textura, nunca con color** (ver Estados).

## Tipografía (Google Fonts)

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Archivo** (variable, ejes `wdth` 62–125 y `wght`) | Titulares enormes, condensados o expandidos; animar el eje `wdth` |
| Editorial | **DM Serif Display** (itálica) | Una palabra de acento dentro de un titular, citas |
| Máquina de escribir | **Courier Prime** | Pedidos legales, códigos de verificación, datos tabulares, etiquetas de ficha |

- Titulares en mayúsculas, interletrado ajustado; cuerpo en Archivo `wdth 100` a 16–18px.
- Números en Courier Prime (tabulares por naturaleza).

## Texturas y recursos gráficos

- **Grano de película:** overlay SVG `feTurbulence` fijo al viewport, opacidad 4–6%, con leve flicker.
- **Halftone:** puntos para rellenos medios (en vez de gris plano).
- **Rayas op-art:** fondos de sección y estados de carga.
- **Bordes:** 2px sólidos de `--ink`; sombras duras desplazadas (`4px 4px 0 var(--ink)`), nunca difusas.
- Esquinas rectas. Como excepción, círculos perfectos (iris, sellos, botones redondos).

## Estados de cuenta (sin color)

| Estado | Tratamiento |
|---|---|
| `TO_REVIEW` por revisar | Ficha con borde sólido, fondo papel |
| `KEEP` conservar | Borde punteado + clip "CONSERVAR" |
| `IN_PROGRESS` en proceso | Fondo con rayas diagonales animadas lentamente |
| `DELETED` borrada | Sello circular "BORRADA" girado (sin tachar el nombre: el sello ya lo dice) |

Dificultad de borrado: escala de 1 a 4 puntos llenos/vacíos (●●○○) más la etiqueta en texto.

## Movimiento

El movimiento es protagonista, pero cada animación cuenta algo del flujo. Stack: **GSAP** (timelines, ScrollTrigger, Flip) + `<Transition>`/`<TransitionGroup>` de Vue para entradas y salidas simples.

### Coreografías firma

| Momento | Animación |
|---|---|
| Landing / hero | Secuencia estilo Saul Bass: barras y formas recortadas entran en cuadro, componen el titular y se reacomodan con el scroll |
| Cambio de ruta | Transición de iris (círculo que se cierra a negro y se abre en la vista nueva) o barrido de cortina |
| Envío del código | El código aparece tipeado letra por letra en Courier Prime |
| Escaneo / búsqueda | Contador de película (cuenta regresiva 3-2-1 con la aguja girando) y después patrón op-art en moiré mientras llegan resultados |
| Cuentas encontradas | Las fichas caen y se apilan (stagger), el contador sube como cartel de persianas (split-flap) |
| Marcar como borrada | El sello baja, golpea con un leve shake y queda girado; la ficha se invierte |
| Pedido legal | El texto se tipea con cursor y "ding" visual al cambiar de línea |
| Progreso total | Barra de expediente que se llena con rayas; al 100%, créditos finales "FIN" |

### Reglas técnicas

- Animar solo `transform`, `opacity`, `clip-path` y ejes de fuentes variables. Nunca `width`/`height`/`top`/`left`.
- Duraciones: micro 120–200ms; transiciones 400–700ms; coreografías hasta 2.5s y siempre salteables.
- Easing: `power3.out` para entradas, `power2.in` para salidas, `steps()` para tipeo y flicker (sensación mecánica).
- **`prefers-reduced-motion: reduce`**: sin parallax, sin moiré, sin flicker; las coreografías pasan a fundidos cortos. Obligatorio en cada animación.
- Las timelines de GSAP viven en composables (`useIrisTransition`, `useStamp`, `useTypewriter`…) y se limpian en `onUnmounted` (`ctx.revert()`).
- Nada de animación que bloquee la interacción: el usuario puede hacer click mientras algo se anima.

## Accesibilidad

- Contraste de tinta sobre papel ~18:1; `--ink-40` solo para decoración, nunca texto.
- Foco visible: contorno de 3px de `--ink` desplazado 3px.
- El grano y las rayas son `aria-hidden` y `pointer-events: none`.
- Los estados nunca dependen solo de la textura: siempre hay etiqueta de texto.

## Qué NO hacer

- Colores de acento, gradientes de color o rojo para "borrar".
- Sombras difusas, glassmorphism, esquinas redondeadas genéricas.
- Fuentes del sistema o Inter.
- Animaciones decorativas sin significado o en loop permanente sobre contenido de lectura.
- Emojis como íconos.

## Checklist para cada componente

- [ ] Solo tokens `--paper` / `--ink*`
- [ ] Funciona en `data-theme="negative"`
- [ ] Animación con fallback de `prefers-reduced-motion`
- [ ] Estado comunicado con forma/textura + texto
- [ ] Foco visible y operable por teclado

## Deuda conocida

(vacía — listar acá los archivos que no cumplen este documento para que no se copien sus patrones)
