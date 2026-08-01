import { api } from './http'
import type {
  CreatePhonePayload,
  Paginated,
  Phone,
  PhoneLabel,
  PhoneListQuery,
  UpdatePhonePayload,
} from './types'

export const phonesApi = {
  list(query: PhoneListQuery) {
    return api.get<Paginated<Phone>>('/phones', { params: query }).then((r) => r.data)
  },
  get(id: string) {
    return api.get<Phone>(`/phones/${id}`).then((r) => r.data)
  },
  create(payload: CreatePhonePayload) {
    return api.post<Phone>('/phones', payload).then((r) => r.data)
  },
  update(id: string, payload: UpdatePhonePayload) {
    return api.patch<Phone>(`/phones/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/phones/${id}`).then((r) => r.data)
  },
  label(id: string) {
    return api.get<PhoneLabel>(`/phones/${id}/label`).then((r) => r.data)
  },
}
