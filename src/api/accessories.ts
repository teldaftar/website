import { api } from './http'
import type {
  Accessory,
  AccessoryListQuery,
  AddStockPayload,
  CreateAccessoryPayload,
  Paginated,
  SoldAccessoryDetail,
  SoldAccessoryListQuery,
  SoldAccessoryRow,
  StockEntry,
  UpdateAccessoryPayload,
} from './types'

export const accessoriesApi = {
  list(query: AccessoryListQuery) {
    return api.get<Paginated<Accessory>>('/accessories', { params: query }).then((r) => r.data)
  },
  get(id: string) {
    return api.get<Accessory>(`/accessories/${id}`).then((r) => r.data)
  },
  create(payload: CreateAccessoryPayload) {
    return api.post<Accessory>('/accessories', payload).then((r) => r.data)
  },
  update(id: string, payload: UpdateAccessoryPayload) {
    return api.patch<Accessory>(`/accessories/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/accessories/${id}`).then((r) => r.data)
  },
  addStock(id: string, payload: AddStockPayload) {
    return api.post<Accessory>(`/accessories/${id}/stock`, payload).then((r) => r.data)
  },
  stockHistory(id: string) {
    return api.get<StockEntry[]>(`/accessories/${id}/stock`).then((r) => r.data)
  },
  sold(query: SoldAccessoryListQuery) {
    return api
      .get<Paginated<SoldAccessoryRow>>('/accessories/sold', { params: query })
      .then((r) => r.data)
  },
  soldDetail(id: string) {
    return api.get<SoldAccessoryDetail>(`/accessories/${id}/sold`).then((r) => r.data)
  },
}
