import { toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { salesApi } from '@/api/sales'
import { usePaginatedList } from './usePaginatedList'
import type {
  CreateAccessorySalePayload,
  CreatePhoneSalePayload,
  ReturnPayload,
  SaleListQuery,
} from '@/api/types'

export function useSalesList(filters: MaybeRefOrGetter<SaleListQuery>) {
  return usePaginatedList('sales', salesApi.list, filters)
}

export function useSale(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.get(toValue(id)),
  })
}

export function useSaleReturns(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['sale-returns', id],
    queryFn: () => salesApi.returns(toValue(id)),
  })
}

/** Invalidate everything a sale touches: sales, phones/accessories stock, debts, stats. */
function invalidateAfterSale(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['phones'] })
  qc.invalidateQueries({ queryKey: ['phone'] })
  qc.invalidateQueries({ queryKey: ['accessories'] })
  qc.invalidateQueries({ queryKey: ['accessories-sold'] })
  qc.invalidateQueries({ queryKey: ['accessory-sold'] })
  qc.invalidateQueries({ queryKey: ['debts'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
}

export function useCreatePhoneSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePhoneSalePayload) => salesApi.createPhoneSale(payload),
    onSuccess: () => invalidateAfterSale(qc),
  })
}

export function useCreateAccessorySale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAccessorySalePayload) => salesApi.createAccessorySale(payload),
    onSuccess: () => invalidateAfterSale(qc),
  })
}

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnPayload }) =>
      salesApi.createReturn(id, payload),
    onSuccess: (sale) => {
      invalidateAfterSale(qc)
      qc.invalidateQueries({ queryKey: ['sale', sale.id] })
      qc.invalidateQueries({ queryKey: ['sale-returns', sale.id] })
    },
  })
}
