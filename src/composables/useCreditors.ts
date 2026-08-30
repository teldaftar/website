import { type MaybeRefOrGetter } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { creditorsApi } from '@/api/creditors'
import { usePaginatedList } from './usePaginatedList'
import type { CreateCreditorPayload, CreditorListQuery, UpdateCreditorPayload } from '@/api/types'

export function useCreditorsList(filters: MaybeRefOrGetter<CreditorListQuery>) {
  return usePaginatedList('creditors', creditorsApi.list, filters)
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['creditors'] })
}

export function useCreateCreditor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCreditorPayload) => creditorsApi.create(payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateCreditor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCreditorPayload }) =>
      creditorsApi.update(id, payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteCreditor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => creditorsApi.remove(id),
    onSuccess: () => invalidate(qc),
  })
}
