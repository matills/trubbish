---
name: vite-patterns
description: Vite build tool patterns including config, plugins, HMR, env variables, proxy setup, SSR, library mode, dependency pre-bundling, and build optimization. Activate when working with vite.config.ts, Vite plugins, or Vite-based projects.
origin: ECC
---

# Patrones de Vite

Patrones de build tool y dev server para proyectos Vite 8+. Cubre configuración, variables de entorno, setup de proxy, library mode, pre-bundling de dependencias, y trampas comunes de producción.

## Cuándo usarlo

- Al configurar `vite.config.ts` o `vite.config.js`
- Al configurar variables de entorno o archivos `.env`
- Al configurar el proxy del dev server para backends de API
- Al optimizar el output del build (chunks, minificación, assets)
- Al publicar librerías con `build.lib`
- Al resolver problemas de pre-bundling de dependencias o interop CJS/ESM
- Al debuggear HMR, el dev server, o errores de build
- Al elegir u ordenar plugins de Vite

## Cómo funciona

- El **modo dev** sirve los archivos fuente como ESM nativo — sin bundling. Las transformaciones ocurren on-demand por request de módulo, por eso los cold starts son rápidos y el HMR es preciso.
- El **modo build** usa Rolldown (v7+) o Rollup (v5–v6) para bundlear la app para producción con tree-shaking, code-splitting, y minificación basada en Oxc.
- El **pre-bundling de dependencias** convierte deps CJS/UMD a ESM una vez vía esbuild y cachea el resultado bajo `node_modules/.vite`, así los siguientes arranques se saltean ese trabajo.
- Los **plugins** comparten una interfaz unificada entre dev y build — el mismo objeto plugin funciona tanto para las transformaciones on-demand del dev server como para el pipeline de producción.
- Las **variables de entorno** se inlinean estáticamente en build time. Las vars con prefijo `VITE_` se convierten en constantes públicas en el bundle; todo lo que no tiene prefijo es invisible para el código del cliente.

## Ejemplos

### Estructura de config

#### Config básica

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
})
```

#### Config condicional

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())   // Solo con prefijo VITE_ (seguro)

  return {
    plugins: [react()],
    server: command === 'serve' ? { port: 3000 } : undefined,
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})
```

#### Opciones de config clave

| Key | Default | Descripción |
|-----|---------|-------------|
| `root` | `'.'` | Raíz del proyecto (donde vive `index.html`) |
| `base` | `'/'` | Base path público para los assets deployados |
| `envPrefix` | `'VITE_'` | Prefijo para env vars expuestas al cliente |
| `build.outDir` | `'dist'` | Directorio de output |
| `build.minify` | `'oxc'` | Minifier (`'oxc'`, `'terser'`, o `false`) |
| `build.sourcemap` | `false` | `true`, `'inline'`, o `'hidden'` |

### Plugins

#### Plugins esenciales

La mayoría de las necesidades de plugins están cubiertas por un puñado de paquetes bien mantenidos. Recurrir a estos antes de escribir uno propio.

| Plugin | Propósito | Cuándo usarlo |
|--------|---------|-------------|
| `@vitejs/plugin-react-swc` | HMR + Fast Refresh de React vía SWC | Default para apps React (más rápido que la variante Babel) |
| `@vitejs/plugin-react` | HMR + Fast Refresh de React vía Babel | Solo si necesitás plugins de Babel (emotion, decorators de MobX) |
| `@vitejs/plugin-vue` | Soporte de SFC de Vue 3 | Apps Vue |
| `vite-plugin-checker` | Corre `tsc` + ESLint en un worker thread con overlay de HMR | **Cualquier app TypeScript** — Vite NO type-checkea durante `vite build` |
| `vite-tsconfig-paths` | Respeta los alias `paths` de `tsconfig.json` | Siempre que ya tengas alias en `tsconfig.json` |
| `vite-plugin-dts` | Emite archivos `.d.ts` en library mode | Al publicar librerías TypeScript |
| `vite-plugin-svgr` | Importa SVGs como componentes React | Apps React que usan SVGs como componentes |
| `rollup-plugin-visualizer` | Reporte treemap/sunburst del bundle | Auditorías periódicas de tamaño de bundle (usar `enforce: 'post'`) |
| `vite-plugin-pwa` | PWA zero-config + Workbox | Apps con capacidad offline |

**Aviso crítico:** `vite build` transpila pero NO type-checkea. Los errores de tipos llegan silenciosamente a producción salvo que agregues `vite-plugin-checker` o corras `tsc --noEmit` en el CI.

#### Escribir plugins custom

Escribir uno propio es poco común — la mayoría de las necesidades están cubiertas por plugins existentes. Cuando de verdad necesites uno, empezá inline en `vite.config.ts` y extraelo solo si se reutiliza.

```typescript
// vite.config.ts — plugin inline mínimo
function myPlugin(): Plugin {
  return {
    name: 'my-plugin',                       // requerido, debe ser único
    enforce: 'pre',                           // 'pre' | 'post' (opcional)
    apply: 'build',                           // 'build' | 'serve' (opcional)
    transform(code, id) {
      if (!id.endsWith('.custom')) return
      return { code: transformCustom(code), map: null }
    },
  }
}
```

**Hooks clave:** `transform` (modificar el source), `resolveId` + `load` (módulos virtuales), `transformIndexHtml` (inyectar en el HTML), `configureServer` (agregar middleware de dev), `hotUpdate` (HMR custom — reemplaza el deprecado `handleHotUpdate` en v7+).

**Los módulos virtuales** usan la convención de prefijo `\0` — `resolveId` devuelve `'\0virtual:my-id'` para que otros plugins lo salteen. El código de usuario importa `'virtual:my-id'`.

Para la API completa de plugins, ver [vite.dev/guide/api-plugin](https://vite.dev/guide/api-plugin). Usar `vite-plugin-inspect` durante el desarrollo para debuggear el pipeline de transformación.

### API de HMR

Los plugins de framework (`@vitejs/plugin-react`, `@vitejs/plugin-vue`, etc.) manejan el HMR automáticamente. Recurrir a `import.meta.hot` directamente solo al construir stores de estado custom, dev tools, o utilidades agnósticas de framework que necesiten persistir estado entre updates.

```typescript
// src/store.ts — HMR manual para un módulo vanilla
if (import.meta.hot) {
  // Persistir estado entre updates (hay que MUTAR, nunca reasignar .data)
  import.meta.hot.data.count = import.meta.hot.data.count ?? 0

  // Limpiar side effects antes de que se reemplace el módulo
  import.meta.hot.dispose((data) => clearInterval(data.intervalId))

  // Aceptar los updates de este propio módulo
  import.meta.hot.accept()
}
```

Todo el código `import.meta.hot` se elimina vía tree-shaking en los builds de producción — no hace falta remover guards manualmente.

### Variables de entorno

Vite carga `.env`, `.env.local`, `.env.[mode]`, y `.env.[mode].local` en ese orden (el último sobreescribe al anterior); los archivos `*.local` están gitignored y son para secrets locales.

#### Acceso del lado del cliente

Solo las vars con prefijo `VITE_` se exponen al código del cliente:

```typescript
import.meta.env.VITE_API_URL   // string
import.meta.env.MODE            // 'development' | 'production' | custom
import.meta.env.BASE_URL        // valor de la config base
import.meta.env.DEV             // boolean
import.meta.env.PROD            // boolean
import.meta.env.SSR             // boolean
```

#### Usar env en la config

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())          // Solo con prefijo VITE_ (seguro)
  return {
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})
```

### Seguridad

#### El prefijo `VITE_` NO es un límite de seguridad

Cualquier variable con prefijo `VITE_` se **inlinea estáticamente en el bundle del cliente en build time**. Minificación, encoding base64, y deshabilitar source maps NO la ocultan. Un atacante decidido puede extraer cualquier var `VITE_` del JavaScript shippeado.

**Regla:** solo valores públicos (URLs de API, feature flags, keys públicas) van en vars `VITE_`. Los secrets (tokens de API, URLs de base de datos, keys privadas) DEBEN vivir del lado del servidor detrás de una API o función serverless.

#### La trampa de `loadEnv('')`

```typescript
// MAL: pasar '' como tercer arg carga TODAS las env vars — incluyendo secrets
// del servidor — y las hace disponibles para inlinear en código de cliente vía `define`.
const env = loadEnv(mode, process.cwd(), '')

// BIEN: lista de prefijos explícita
const env = loadEnv(mode, process.cwd(), ['VITE_', 'APP_'])
```

#### Source Maps en producción

Los source maps de producción filtran tu código fuente original. Deshabilitarlos salvo que los subas a un error tracker (Sentry, Bugsnag) y los borres localmente después:

```typescript
build: {
  sourcemap: false,                                  // default — mantenerlo así
}
```

#### Checklist de `.gitignore`

- `.env.local`, `.env.*.local` — overrides de secrets locales
- `dist/` — output del build
- `node_modules/.vite` — cache de pre-bundle (las entradas obsoletas causan errores fantasma)

### Proxy del server

```typescript
// vite.config.ts — server.proxy
server: {
  proxy: {
    '/foo': 'http://localhost:4567',                    // shorthand de string

    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,                               // necesario para backends virtual-hosted
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

Para proxying de WebSocket, agregar `ws: true` a la config de la ruta.

### Optimización de build

#### Manual Chunks

```typescript
// vite.config.ts — build.rolldownOptions
build: {
  rolldownOptions: {
    output: {
      // Forma objeto: agrupar paquetes específicos
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
      },
    },
  },
}
```

```typescript
// Forma función: dividir por heurística
manualChunks(id) {
  if (id.includes('node_modules/react')) return 'react-vendor'
  if (id.includes('node_modules')) return 'vendor'
}
```

### Performance

#### Evitar barrel files

Los barrel files (`index.ts` re-exportando todo desde un directorio) fuerzan a Vite a cargar cada archivo re-exportado incluso cuando importás un solo símbolo. Es el enlentecimiento #1 del dev-server marcado por la doc oficial.

```typescript
// MAL — importar un util fuerza a Vite a cargar todo el barrel
import { slash } from '@/utils'

// BIEN — import directo, solo se carga ese archivo
import { slash } from '@/utils/slash'
```

#### Ser explícito con las extensiones de import

Cada extensión implícita fuerza hasta 6 chequeos de filesystem vía `resolve.extensions`. En codebases grandes, esto se acumula.

```typescript
// MAL
import Component from './Component'

// BIEN
import Component from './Component.tsx'
```

Acotar `allowImportingTsExtensions` de `tsconfig.json` + `resolve.extensions` solo a las extensiones que realmente usás.

#### Warm-up de rutas hot-path

`server.warmup.clientFiles` pre-transforma los entry points hot conocidos antes de que el browser los pida — eliminando el waterfall de requests de cold-load en apps grandes.

```typescript
// vite.config.ts
server: {
  warmup: {
    clientFiles: ['./src/main.tsx', './src/routes/**/*.tsx'],
  },
}
```

#### Profiling de dev servers lentos

Cuando `vite dev` se siente lento, empezar con `vite --profile`, interactuar con la app, y después apretar `p+enter` para guardar un `.cpuprofile`. Cargarlo en [Speedscope](https://www.speedscope.app) para encontrar qué plugins están consumiendo tiempo — usualmente los hooks `buildStart`, `config`, o `configResolved` en plugins de la comunidad.

### Library Mode

Al publicar un paquete npm, usar `build.lib`. Dos footguns importan más que el detalle de config:

1. **Los types no se emiten** — agregar `vite-plugin-dts` o correr `tsc --emitDeclarationOnly` por separado.
2. **Las peer dependencies DEBEN externalizarse** — los peers no listados se bundlean en tu librería, causando errores de runtime duplicado en los consumidores.

```typescript
// vite.config.ts
build: {
  lib: {
    entry: 'src/index.ts',
    formats: ['es', 'cjs'],
    fileName: (format) => `my-lib.${format}.js`,
  },
  rolldownOptions: {
    external: ['react', 'react-dom', 'react/jsx-runtime'],  // cada peer dep
  },
}
```

### SSR Externals

Los setups de `createServer({ middlewareMode: true })` a secas son territorio de autores de frameworks. La mayoría de las apps deberían usar Nuxt, Remix, SvelteKit, Astro, o TanStack Start en su lugar. Lo que *sí* vas a ajustar como usuario de un framework es la config de externals cuando las deps se rompen en SSR:

```typescript
// vite.config.ts — opciones ssr
ssr: {
  external: ['node-native-package'],           // mantener como require() en el bundle SSR
  noExternal: ['esm-only-package'],            // forzar bundle en el output SSR (corrige la mayoría de errores SSR)
  target: 'node',                              // 'node' o 'webworker'
}
```

### Pre-Bundling de dependencias

Vite pre-bundlea dependencias para convertir CJS/UMD a ESM y reducir la cantidad de requests.

```typescript
// vite.config.ts — optimizeDeps
optimizeDeps: {
  include: [
    'lodash-es',                              // forzar pre-bundle de deps pesadas conocidas
    'cjs-package',                            // deps CJS que causan problemas de interop
    'deep-lib/components/**',                 // glob para imports profundos
  ],
  exclude: ['local-esm-package'],             // debe ser ESM válido si se excluye
  force: true,                                // ignorar la cache, re-optimizar (debugging temporal)
}
```

### Trampas comunes

#### Dev no coincide con build

Dev usa esbuild/Rolldown para las transformaciones; build usa Rolldown para bundlear. Las librerías CJS pueden comportarse distinto entre ambos. Siempre verificar con `vite build && vite preview` antes de deployar.

#### Chunks obsoletos después del deployment

Los builds nuevos producen hashes de chunk nuevos. Los usuarios con sesiones activas piden nombres de archivo viejos que ya no existen. Vite no tiene solución incorporada para esto. Mitigaciones:

- Mantener vivos los archivos viejos de `dist/assets/` durante una ventana de deployment
- Capturar errores de dynamic import en tu router y forzar un reload de página

#### Docker y contenedores

Vite bindea a `localhost` por defecto, lo cual es inalcanzable desde fuera de un contenedor:

```typescript
// vite.config.ts — setup Docker/contenedores
server: {
  host: true,                                  // bindear a 0.0.0.0
  hmr: { clientPort: 3000 },                   // si está detrás de un reverse proxy
}
```

#### Acceso a archivos en monorepo

Vite restringe el servido de archivos a la raíz del proyecto. Los paquetes fuera de la raíz quedan bloqueados:

```typescript
// vite.config.ts — acceso a archivos en monorepo
server: {
  fs: {
    allow: ['..'],                             // permitir el directorio padre (raíz del workspace)
  },
}
```

### Anti-patrones

```typescript
// MAL: setear envPrefix a '' expone TODAS las env vars (incluyendo secrets) al cliente
envPrefix: ''

// MAL: asumir que require() funciona en el código fuente de la aplicación — Vite es ESM-first
const lib = require('some-lib')                // usar import en su lugar

// MAL: dividir cada node_module en su propio chunk — crea cientos de archivos chiquitos
manualChunks(id) {
  if (id.includes('node_modules')) {
    return id.split('node_modules/')[1].split('/')[0]   // un chunk por paquete
  }
}

// MAL: no externalizar las peer deps en library mode — causa errores de runtime duplicado
// build.lib sin rolldownOptions.external

// MAL: usar el minifier esbuild deprecado
build: { minify: 'esbuild' }                  // usar 'oxc' (default) o 'terser'

// MAL: mutar import.meta.hot.data por reasignación
import.meta.hot.data = { count: 0 }           // INCORRECTO: hay que mutar propiedades, no reasignar
import.meta.hot.data.count = 0                 // CORRECTO
```

**Anti-patrones de proceso:**

- **`vite preview` NO es un servidor de producción** — es un smoke test para el bundle buildeado. Deployar `dist/` a un host estático real (NGINX, Cloudflare Pages, Vercel static) o usar un Dockerfile multi-stage.
- **Esperar que `vite build` type-cheque** — solo transpila. Los errores de tipos llegan silenciosamente a producción. Agregar `vite-plugin-checker` o correr `tsc --noEmit` en el CI.
- **Shippear `@vitejs/plugin-legacy` por defecto** — infla los bundles ~40%, rompe los analizadores de bundle basados en source-map, y es innecesario para el 95%+ de usuarios en browsers modernos. Habilitarlo en base a analytics reales, no por suposición.
- **Armar a mano 30+ entradas de `resolve.alias` que duplican los paths de `tsconfig.json`** — usar `vite-tsconfig-paths` en su lugar. Observado en Excalidraw y PostHog; evitar en proyectos nuevos.
- **Dejar `node_modules/.vite` obsoleto después de cambios de dependencias** — la cache de pre-bundle causa errores fantasma. Limpiarla al cambiar de branch o después de parchear deps.

## Referencia rápida

| Patrón | Cuándo usarlo |
|---------|-------------|
| `defineConfig` | Siempre — provee inferencia de tipos |
| `loadEnv(mode, root, ['VITE_'])` | Acceder a env vars en la config (prefijo explícito) |
| `vite-plugin-checker` | Cualquier app TypeScript (llena el gap de type-check) |
| `vite-tsconfig-paths` | En vez de armar `resolve.alias` a mano |
| `optimizeDeps.include` | Deps CJS que causan problemas de interop |
| `server.proxy` | Rutear requests de API al backend en dev |
| `server.host: true` | Docker, contenedores, acceso remoto |
| `server.warmup.clientFiles` | Pre-transformar rutas hot-path |
| `build.lib` + `external` | Publicar paquetes npm |
| `manualChunks` (objeto) | División del vendor bundle |
| `vite --profile` | Debuggear un dev server lento |
| `vite build && vite preview` | Smoke-test del bundle de prod localmente (NO es un server de prod) |

## Skills relacionados

- `frontend-patterns` — patrones de componentes React
- `docker-patterns` — dev containerizado con Vite
- `nextjs-turbopack` — bundler alternativo para Next.js
