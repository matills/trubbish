import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Me, RequestCodeResponse } from '@borrar/shared'
import { ApiError } from '@/services/api'
import { authService } from '@/services'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Me | null>(null)
  const checked = ref(false)

  async function fetchMe(): Promise<Me | null> {
    try {
      user.value = await authService.me()
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) throw err
      user.value = null
    } finally {
      checked.value = true
    }
    return user.value
  }

  async function ensureChecked(): Promise<Me | null> {
    return checked.value ? user.value : fetchMe()
  }

  function requestCode(email: string): Promise<RequestCodeResponse> {
    return authService.requestCode(email)
  }

  async function verify(email: string, code: string): Promise<void> {
    await authService.verify(email, code)
    await fetchMe()
  }

  async function logout(): Promise<void> {
    await authService.logout()
    user.value = null
  }

  async function deleteEverything(): Promise<void> {
    await authService.deleteEverything()
    user.value = null
  }

  return { user, checked, fetchMe, ensureChecked, requestCode, verify, logout, deleteEverything }
})
