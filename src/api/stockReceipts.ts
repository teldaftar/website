import { api } from './http'
import type {
  CreateStockReceiptPayload,
  Paginated,
  StockReceipt,
  StockReceiptListQuery,
  StockReceiptRow,
} from './types'

export const stockReceiptsApi = {
  list(query: StockReceiptListQuery) {
    return api
      .get<Paginated<StockReceiptRow>>('/stock-receipts', { params: query })
      .then((r) => r.data)
  },
  get(id: string) {
    return api.get<StockReceipt>(`/stock-receipts/${id}`).then((r) => r.data)
  },
  create(payload: CreateStockReceiptPayload) {
    return api.post<StockReceipt>('/stock-receipts', payload).then((r) => r.data)
  },
  // PATCH replaces the whole line list (not a diff) — send the full items array.
  update(id: string, payload: CreateStockReceiptPayload) {
    return api.patch<StockReceipt>(`/stock-receipts/${id}`, payload).then((r) => r.data)
  },
  remove(id: string) {
    return api.delete(`/stock-receipts/${id}`).then((r) => r.data)
  },
}
