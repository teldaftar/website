import { toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { debtsApi } from '@/api/debts'
import { usePaginatedList } from './usePaginatedList'
import type { DebtListQuery, PayDebtPayload, UpdateDebtPayload } from '@/api/types'

export function useDebtsList(filters: MaybeRefOrGetter<DebtListQuery>) {
  return usePaginatedList('debts', debtsApi.list, filters)
}

export function useDebtPayments(
  id: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  return useQuery({
    queryKey: ['debt-payments', id],
    queryFn: () => debtsApi.payments(toValue(id)),
    enabled: () => toValue(enabled) && !!toValue(id),
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['debts'] })
  qc.invalidateQueries({ queryKey: ['debt-payments'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
  // Sales and phones embed the debt (with remaining/paidTotal), so refresh them too.
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['sales-full'] })
  qc.invalidateQueries({ queryKey: ['sale'] })
  qc.invalidateQueries({ queryKey: ['phones'] })
  qc.invalidateQueries({ queryKey: ['phone'] })
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
