import { type MaybeRefOrGetter } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { expensesApi } from '@/api/expenses'
import { usePaginatedList } from './usePaginatedList'
import type { CreateExpensePayload, ExpenseListQuery, UpdateExpensePayload } from '@/api/types'

export function useExpensesList(filters: MaybeRefOrGetter<ExpenseListQuery>) {
  return usePaginatedList('expenses', expensesApi.list, filters)
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['expenses'] })
  qc.invalidateQueries({ queryKey: ['statistics'] })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.create(payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      expensesApi.update(id, payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => invalidate(qc),
  })
}
