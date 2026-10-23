import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      // El front consume el contrato desde el fuente (ESM); la API usa el build CJS.
      '@borrar/shared': resolve(import.meta.dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3010', changeOrigin: true },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
