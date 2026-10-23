import type {
  AccountSource,
  AccountStats,
  AccountStatus,
  BreachScan,
  BulkImportResult,
  CatalogEntry,
  DeletionRequest,
  Law,
  Me,
  RequestCodeResponse,
  RequestStatus,
  TrackedAccount,
} from '@trubbish/shared'
import { api } from './api'

export const authService = {
  requestCode: (email: string) => api.post<RequestCodeResponse>('/auth/code', { email }),
  verify: (email: string, code: string) => api.post<{ id: number; email: string }>('/auth/verify', { email, code }),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<Me>('/me'),
  deleteEverything: () => api.delete('/me'),
}

export const catalogService = {
  list: () => api.get<CatalogEntry[]>('/catalog'),
}

export interface CreateAccountInput {
  serviceId?: number
  domain?: string
  name?: string
  source: AccountSource
  notes?: string
}

export interface UpdateAccountInput {
  status?: AccountStatus
  notes?: string | null
  confirmSensitive?: boolean
}

export const accountsService = {
  list: () => api.get<TrackedAccount[]>('/accounts'),
  stats: () => api.get<AccountStats>('/accounts/stats'),
  get: (id: number) => api.get<TrackedAccount>(`/accounts/${id}`),
  create: (input: CreateAccountInput) => api.post<TrackedAccount>('/accounts', input),
  bulk: (source: AccountSource, items: { domain: string; name?: string }[]) =>
    api.post<BulkImportResult>('/accounts/bulk', { source, items }),
  update: (id: number, input: UpdateAccountInput) => api.patch<TrackedAccount>(`/accounts/${id}`, input),
  remove: (id: number) => api.delete(`/accounts/${id}`),
}

export const breachesService = {
  latest: () => api.get<BreachScan | null>('/breaches/latest'),
  scan: () => api.post<BreachScan>('/breaches/scans'),
}

export interface CreateRequestInput {
  accountId: number
  law: Law
  fullName: string
  documentId?: string
  recipient?: string
}

export const requestsService = {
  list: (accountId?: number) => api.get<DeletionRequest[]>(accountId ? `/requests?accountId=${accountId}` : '/requests'),
  create: (input: CreateRequestInput) => api.post<DeletionRequest>('/requests', input),
  setStatus: (id: number, status: RequestStatus) => api.patch<DeletionRequest>(`/requests/${id}`, { status }),
  remove: (id: number) => api.delete(`/requests/${id}`),
}
