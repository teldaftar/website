import { toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { phonesApi } from '@/api/phones'
import { usePaginatedList } from './usePaginatedList'
import type { CreatePhonePayload, PhoneListQuery, UpdatePhonePayload } from '@/api/types'

export function usePhonesList(filters: MaybeRefOrGetter<PhoneListQuery>) {
  return usePaginatedList('phones', phonesApi.list, filters)
}

export function usePhone(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['phone', id],
    queryFn: () => phonesApi.get(toValue(id)),
  })
}

export function usePhoneLabel(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['phone-label', id],
    queryFn: () => phonesApi.label(toValue(id)),
  })
}

export function useCreatePhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePhonePayload) => phonesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phones'] }),
  })
}

export function useUpdatePhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePhonePayload }) =>
      phonesApi.update(id, payload),
    onSuccess: (phone) => {
      qc.invalidateQueries({ queryKey: ['phones'] })
      qc.invalidateQueries({ queryKey: ['phone', phone.id] })
      // The label is a separate query — refresh it too, or it stays stale
      // (e.g. an IMEI added on edit won't show until a manual reload).
      qc.invalidateQueries({ queryKey: ['phone-label', phone.id] })
    },
  })
}

export function useDeletePhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => phonesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['phones'] }),
  })
}
