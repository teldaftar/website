import { toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { stockReceiptsApi } from '@/api/stockReceipts'
import { usePaginatedList } from './usePaginatedList'
import type { CreateStockReceiptPayload, StockReceiptListQuery } from '@/api/types'

export function useStockReceiptsList(filters: MaybeRefOrGetter<StockReceiptListQuery>) {
  return usePaginatedList('stock-receipts', stockReceiptsApi.list, filters)
}

export function useStockReceipt(
  id: MaybeRefOrGetter<string>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  return useQuery({
    queryKey: ['stock-receipt', id],
    queryFn: () => stockReceiptsApi.get(toValue(id)),
    enabled: options?.enabled,
  })
}

/**
 * A receipt create/edit/delete creates/restocks accessories, appends stock
 * history, shifts quantities and the statistics — refresh everything it touches.
 */
function invalidateAfterReceipt(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['accessories'] })
  qc.invalidateQueries({ queryKey: ['accessories-sold'] })
  qc.invalidateQueries({ queryKey: ['accessory'] })
  qc.invalidateQueries({ queryKey: ['accessory-stock'] })
  qc.invalidateQueries({ queryKey: ['stock-receipts'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
}

export function useCreateStockReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStockReceiptPayload) => stockReceiptsApi.create(payload),
    onSuccess: () => invalidateAfterReceipt(qc),
  })
}

export function useUpdateStockReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateStockReceiptPayload }) =>
      stockReceiptsApi.update(id, payload),
    onSuccess: (receipt) => {
      invalidateAfterReceipt(qc)
      qc.invalidateQueries({ queryKey: ['stock-receipt', receipt.id] })
    },
  })
}

export function useDeleteStockReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockReceiptsApi.remove(id),
    onSuccess: () => invalidateAfterReceipt(qc),
  })
}
