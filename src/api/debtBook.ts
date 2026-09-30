import { api } from './http'
import type {
  CreateDebtBookPayload,
  DebtBookEntry,
  DebtBookListQuery,
  Paginated,
  UpdateDebtBookPayload,
} from './types'

export const debtBookApi = {
  list(query: DebtBookListQuery) {
    return api.get<Paginated<DebtBookEntry>>('/debt-book', { params: query }).then((r) => r.data)
  },
  get(id: string) {
    return api.get<DebtBookEntry>(`/debt-book/${id}`).then((r) => r.data)
  },
  create(payload: CreateDebtBookPayload) {
    return api.post<DebtBookEntry>('/debt-book', payload).then((r) => r.data)
  },
  update(id: string, payload: UpdateDebtBookPayload) {
    return api.patch<DebtBookEntry>(`/debt-book/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/debt-book/${id}`).then((r) => r.data)
  },
}
