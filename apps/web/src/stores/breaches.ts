import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ScanStatus, type BreachScan } from '@borrar/shared'
import { breachesService } from '@/services'

const POLL_MS = 1500
const MAX_POLLS = 40

export const useBreachesStore = defineStore('breaches', () => {
  const scan = ref<BreachScan | null>(null)
  const scanning = ref(false)

  async function fetchLatest(): Promise<void> {
    scan.value = await breachesService.latest()
  }

  /** Dispara el escaneo (va por cola en el backend) y espera el resultado. */
  async function startScan(): Promise<BreachScan> {
    scanning.value = true
    try {
      let current = await breachesService.scan()
      for (let i = 0; i < MAX_POLLS && (current.status === ScanStatus.QUEUED || current.status === ScanStatus.RUNNING); i++) {
        await new Promise((r) => setTimeout(r, POLL_MS))
        current = (await breachesService.latest()) ?? current
      }
      scan.value = current
      return current
    } finally {
      scanning.value = false
    }
  }

  return { scan, scanning, fetchLatest, startScan }
})
