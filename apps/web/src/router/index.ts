import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    auth?: boolean
    guest?: boolean
    title?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/pages/LandingPage.vue') },
    { path: '/entrar', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { guest: true, title: 'Entrar' } },
    { path: '/expediente', name: 'dossier', component: () => import('@/pages/DossierPage.vue'), meta: { auth: true, title: 'Expediente' } },
    { path: '/descubrir', name: 'discover', component: () => import('@/pages/DiscoverPage.vue'), meta: { auth: true, title: 'Descubrir' } },
    { path: '/cuenta/:id(\\d+)', name: 'account', component: () => import('@/pages/AccountPage.vue'), meta: { auth: true, title: 'Ficha' } },
    { path: '/pedidos', name: 'requests', component: () => import('@/pages/RequestsPage.vue'), meta: { auth: true, title: 'Pedidos' } },
    { path: '/ajustes', name: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: { auth: true, title: 'Ajustes' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const user = await auth.ensureChecked().catch(() => null)
  if (to.meta.auth && !user) return { name: 'login', query: { volver: to.fullPath } }
  if (to.meta.guest && user) return { name: 'dossier' }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Borrar mi vida digital` : 'Borrar mi vida digital'
})
