import type { AccountSource, AccountStatus, Category, Difficulty, Law, RequestStatus } from '@borrar/shared'

export const STATUS_LABEL: Record<AccountStatus, string> = {
  TO_REVIEW: 'Por revisar',
  KEEP: 'Conservar',
  IN_PROGRESS: 'En proceso',
  DELETED: 'Borrada',
}

export const SOURCE_LABEL: Record<AccountSource, string> = {
  CATALOG: 'Catálogo',
  BROWSER: 'Navegador',
  CONNECTED_APPS: 'Apps conectadas',
  BREACH: 'Filtración',
  GUIDED: 'Memoria guiada',
  MANUAL: 'A mano',
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  IMPOSSIBLE: 'Imposible',
}

export const DIFFICULTY_LEVEL: Record<Difficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3, IMPOSSIBLE: 4 }

export const CATEGORY_LABEL: Record<Category, string> = {
  SOCIAL: 'Redes sociales',
  MESSAGING: 'Mensajería',
  SHOPPING: 'Compras',
  STREAMING: 'Streaming y música',
  GAMING: 'Juegos',
  TRAVEL: 'Viajes y movilidad',
  FOOD: 'Comida',
  PRODUCTIVITY: 'Productividad y nube',
  FINANCE: 'Finanzas',
  WORK: 'Trabajo',
  DATING: 'Citas',
  EDUCATION: 'Educación',
  HEALTH: 'Salud y deporte',
  GOVERNMENT: 'Estado',
  OTHER: 'Otros',
}

export const LAW_LABEL: Record<Law, string> = {
  AR_25326: 'Argentina · Ley 25.326',
  GDPR: 'Unión Europea · RGPD',
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ANSWERED: 'Respondido',
  IGNORED: 'Sin respuesta',
}

export function formatDate(iso: string): string {
  // Una fecha sola ("2018-02-01") se interpreta como UTC y en Argentina caería el día anterior.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}
