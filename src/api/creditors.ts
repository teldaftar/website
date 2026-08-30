import { api } from './http'
import type {
  CreateCreditorPayload,
  Creditor,
  CreditorListQuery,
  Paginated,
  UpdateCreditorPayload,
} from './types'

export const creditorsApi = {
  list(query: CreditorListQuery) {
    return api.get<Paginated<Creditor>>('/creditors', { params: query }).then((r) => r.data)
  },
  create(payload: CreateCreditorPayload) {
    return api.post<Creditor>('/creditors', payload).then((r) => r.data)
  },
  update(id: string, payload: UpdateCreditorPayload) {
    return api.patch<Creditor>(`/creditors/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/creditors/${id}`).then((r) => r.data)
  },
}
