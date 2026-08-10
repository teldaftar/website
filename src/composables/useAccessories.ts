import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { accessoriesApi } from '@/api/accessories'
import { usePaginatedList } from './usePaginatedList'
import type {
  AccessoryListQuery,
  CreateAccessoryPayload,
  SoldAccessoryListQuery,
  UpdateAccessoryPayload,
} from '@/api/types'

export function useAccessoriesList(filters: MaybeRefOrGetter<AccessoryListQuery>) {
  return usePaginatedList('accessories', accessoriesApi.list, filters)
}

export function useSoldAccessoriesList(filters: MaybeRefOrGetter<SoldAccessoryListQuery>) {
  return usePaginatedList('accessories-sold', accessoriesApi.sold, filters)
}

export function useSoldAccessory(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['accessory-sold', id],
    queryFn: () => accessoriesApi.soldDetail(toValue(id)),
  })
}

export function useAccessory(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['accessory', id],
    queryFn: () => accessoriesApi.get(toValue(id)),
  })
}

export function useStockHistory(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['accessory-stock', id],
    queryFn: () => accessoriesApi.stockHistory(toValue(id)),
  })
}

/** Only the FIFO batches that still have stock — for the sale batch picker. */
export function useAvailableStock(id: MaybeRefOrGetter<string | null | undefined>) {
  return useQuery({
    queryKey: ['accessory-stock', 'available', id],
    enabled: computed(() => !!toValue(id)),
    queryFn: () => accessoriesApi.stockHistory(toValue(id) as string, { available: true }),
  })
}

export function useCreateAccessory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAccessoryPayload) => accessoriesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accessories'] }),
  })
}

export function useUpdateAccessory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccessoryPayload }) =>
      accessoriesApi.update(id, payload),
    onSuccess: (acc) => {
      qc.invalidateQueries({ queryKey: ['accessories'] })
      qc.invalidateQueries({ queryKey: ['accessory', acc.id] })
    },
  })
}

export function useDeleteAccessory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accessoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accessories'] }),
  })
}
