import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { salesApi } from '@/api/sales'
import { usePaginatedList } from './usePaginatedList'
import type {
  CreateAccessorySalePayload,
  CreatePhoneSalePayload,
  CreateSalePayload,
  Phone,
  ReturnPayload,
  Sale,
  SaleListQuery,
  SaleType,
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

/** Fetch every sale of a given type, paginating through all pages. */
async function fetchAllSales(type: SaleType): Promise<Sale[]> {
  const first = await salesApi.list({ type, page: 1, limit: 100 })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const res = await salesApi.list({ type, page, limit: 100 })
    all.push(...res.data)
  }
  return all
}

/**
 * The sale a sold phone belongs to, so it can be returned from the phone page.
 * The backend exposes no phone→sale link, so we scan phone sales and match by
 * the product snapshot id (a phone sale has exactly one item).
 */
export function usePhoneSale(phone: MaybeRefOrGetter<Phone | null | undefined>) {
  return useQuery({
    queryKey: ['sales-full', 'PHONE'],
    enabled: computed(() => toValue(phone)?.status === 'SOLD'),
    queryFn: () => fetchAllSales('PHONE'),
    select: (sales): Sale | null => {
      const p = toValue(phone)
      if (!p) return null
      return sales.find((s) => s.items.some((it) => it.product.id === p.id)) ?? null
    },
  })
}

/** All sales that include a given accessory, so each can be returned from the sold sheet. */
export function useAccessorySales(accessoryId: MaybeRefOrGetter<string | null | undefined>) {
  return useQuery({
    queryKey: ['sales-full', 'ACCESSORY'],
    enabled: computed(() => !!toValue(accessoryId)),
    queryFn: () => fetchAllSales('ACCESSORY'),
    select: (sales): Sale[] => {
      const aid = toValue(accessoryId)
      if (!aid) return []
      return sales.filter((s) => s.items.some((it) => it.product.id === aid))
    },
  })
}

/** Invalidate everything a sale touches: sales, phones/accessories stock, debts, stats. */
function invalidateAfterSale(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['sales-full'] })
  qc.invalidateQueries({ queryKey: ['phones'] })
  qc.invalidateQueries({ queryKey: ['phone'] })
  qc.invalidateQueries({ queryKey: ['accessories'] })
  qc.invalidateQueries({ queryKey: ['accessories-sold'] })
  qc.invalidateQueries({ queryKey: ['accessory-sold'] })
  // Remaining per-batch stock changes on every sale — refresh the batch picker/history.
  qc.invalidateQueries({ queryKey: ['accessory-stock'] })
  qc.invalidateQueries({ queryKey: ['debts'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
}

/** Cart-style multi-item sale (`POST /sales`). */
export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => salesApi.create(payload),
    onSuccess: () => invalidateAfterSale(qc),
  })
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
