import { api } from './http'
import type {
  CreateAccessorySalePayload,
  CreatePhoneSalePayload,
  Paginated,
  ReturnPayload,
  Sale,
  SaleListQuery,
  SaleReturn,
} from './types'

export const salesApi = {
  list(query: SaleListQuery) {
    return api.get<Paginated<Sale>>('/sales', { params: query }).then((r) => r.data)
  },
  get(id: string) {
    return api.get<Sale>(`/sales/${id}`).then((r) => r.data)
  },
  createPhoneSale(payload: CreatePhoneSalePayload) {
    return api.post<Sale>('/sales/phone', payload).then((r) => r.data)
  },
  createAccessorySale(payload: CreateAccessorySalePayload) {
    return api.post<Sale>('/sales/accessory', payload).then((r) => r.data)
  },
  createReturn(id: string, payload: ReturnPayload) {
    return api.post<Sale>(`/sales/${id}/return`, payload).then((r) => r.data)
  },
  returns(id: string) {
    return api.get<SaleReturn[]>(`/sales/${id}/returns`).then((r) => r.data)
  },
}
