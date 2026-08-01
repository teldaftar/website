import { api } from './http'
import type {
  CreateExpensePayload,
  Expense,
  ExpenseListQuery,
  Paginated,
  UpdateExpensePayload,
} from './types'

export const expensesApi = {
  list(query: ExpenseListQuery) {
    return api.get<Paginated<Expense>>('/expenses', { params: query }).then((r) => r.data)
  },
  create(payload: CreateExpensePayload) {
    return api.post<Expense>('/expenses', payload).then((r) => r.data)
  },
  update(id: string, payload: UpdateExpensePayload) {
    return api.patch<Expense>(`/expenses/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/expenses/${id}`).then((r) => r.data)
  },
}
