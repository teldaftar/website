import { type MaybeRefOrGetter } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { debtsApi } from '@/api/debts'
import { usePaginatedList } from './usePaginatedList'
import type { DebtListQuery, PayDebtPayload, UpdateDebtPayload } from '@/api/types'

export function useDebtsList(filters: MaybeRefOrGetter<DebtListQuery>) {
  return usePaginatedList('debts', debtsApi.list, filters)
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['debts'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
}

export function usePayDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayDebtPayload }) =>
      debtsApi.pay(id, payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDebtPayload }) =>
      debtsApi.update(id, payload),
    onSuccess: () => invalidate(qc),
  })
}
