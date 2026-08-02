import { api } from './http'
import type {
  Debt,
  DebtListQuery,
  DebtPayment,
  Paginated,
  PayDebtPayload,
  UpdateDebtPayload,
} from './types'

export const debtsApi = {
  list(query: DebtListQuery) {
    return api.get<Paginated<Debt>>('/debts', { params: query }).then((r) => r.data)
  },
  pay(id: string, payload: PayDebtPayload) {
    return api.post<Debt>(`/debts/${id}/pay`, payload).then((r) => r.data)
  },
  payments(id: string) {
    return api.get<DebtPayment[]>(`/debts/${id}/payments`).then((r) => r.data)
  },
  update(id: string, payload: UpdateDebtPayload) {
    return api.patch<Debt>(`/debts/${id}`, payload).then((r) => r.data)
  },
}
