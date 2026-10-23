// Contrato compartido entre apps/api y apps/web: enums como objetos `as const`
// (sirven en runtime en los dos lados) y los tipos de las respuestas de la API.

export const AccountStatus = {
  TO_REVIEW: 'TO_REVIEW',
  KEEP: 'KEEP',
  IN_PROGRESS: 'IN_PROGRESS',
  DELETED: 'DELETED',
} as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const AccountSource = {
  CATALOG: 'CATALOG',
  BROWSER: 'BROWSER',
  CONNECTED_APPS: 'CONNECTED_APPS',
  BREACH: 'BREACH',
  GUIDED: 'GUIDED',
  MANUAL: 'MANUAL',
} as const
export type AccountSource = (typeof AccountSource)[keyof typeof AccountSource]

export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  IMPOSSIBLE: 'IMPOSSIBLE',
} as const
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty]

export const Category = {
  SOCIAL: 'SOCIAL',
  MESSAGING: 'MESSAGING',
  SHOPPING: 'SHOPPING',
  STREAMING: 'STREAMING',
  GAMING: 'GAMING',
  TRAVEL: 'TRAVEL',
  FOOD: 'FOOD',
  PRODUCTIVITY: 'PRODUCTIVITY',
  FINANCE: 'FINANCE',
  WORK: 'WORK',
  DATING: 'DATING',
  EDUCATION: 'EDUCATION',
  HEALTH: 'HEALTH',
  GOVERNMENT: 'GOVERNMENT',
  OTHER: 'OTHER',
} as const
export type Category = (typeof Category)[keyof typeof Category]

/** Categorías donde borrar por error hace daño: piden confirmación explícita. */
export const SENSITIVE_CATEGORIES: readonly Category[] = [
  Category.FINANCE,
  Category.WORK,
  Category.HEALTH,
  Category.GOVERNMENT,
]

export const Law = {
  AR_25326: 'AR_25326',
  GDPR: 'GDPR',
} as const
export type Law = (typeof Law)[keyof typeof Law]

export const RequestStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ANSWERED: 'ANSWERED',
  IGNORED: 'IGNORED',
} as const
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export const ScanStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const
export type ScanStatus = (typeof ScanStatus)[keyof typeof ScanStatus]

export interface Me {
  id: number
  email: string
  createdAt: string
}

export interface RequestCodeResponse {
  expiresInSeconds: number
  /** Solo en desarrollo sin SMTP configurado. */
  devCode?: string
}

export interface CatalogEntry {
  id: number
  slug: string
  name: string
  domain: string
  category: Category
  difficulty: Difficulty
  deleteUrl: string | null
  recoveryUrl: string | null
  privacyEmail: string | null
  steps: string | null
}

export interface TrackedAccount {
  id: number
  name: string
  domain: string
  status: AccountStatus
  source: AccountSource
  notes: string | null
  service: CatalogEntry | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface AccountStats {
  total: number
  byStatus: Record<AccountStatus, number>
  closeRate: number
}

export interface BulkImportResult {
  created: number
  skipped: number
}

export interface Breach {
  name: string
  title: string
  domain: string
  breachDate: string
  dataClasses: string[]
}

export interface BreachScan {
  id: number
  status: ScanStatus
  demo: boolean
  createdAt: string
  finishedAt: string | null
  breaches: Breach[]
}

export interface DeletionRequest {
  id: number
  accountId: number
  law: Law
  status: RequestStatus
  recipient: string | null
  subject: string
  body: string
  sentAt: string | null
  dueAt: string | null
  createdAt: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
