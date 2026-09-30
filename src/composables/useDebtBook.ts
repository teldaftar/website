import { type MaybeRefOrGetter, toValue } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { debtBookApi } from '@/api/debtBook'
import { normalizeError, toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import type { CreateDebtBookPayload, DebtBookListQuery, UpdateDebtBookPayload } from '@/api/types'

/**
 * One page of the debt book. Page-based (not infinite) because the view shows
 * numbered pagination and a per-page total.
 */
export function useDebtBookPage(query: MaybeRefOrGetter<DebtBookListQuery>) {
  return useQuery({
    queryKey: ['debt-book', query],
    queryFn: () => debtBookApi.list(toValue(query)),
    // Keep the current page on screen while the next page / filter loads.
    placeholderData: keepPreviousData,
  })
}

/** Error text for debt-book actions: a 404 reads "Yozuv topilmadi". */
export function debtBookErrorMessage(err: unknown): string {
  return normalizeError(err).statusCode === 404 ? t('debtBook.notFound') : toUserMessage(err)
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['debt-book'] })
}

export function useCreateDebtBookEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDebtBookPayload) => debtBookApi.create(payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateDebtBookEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDebtBookPayload }) =>
      debtBookApi.update(id, payload),
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteDebtBookEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => debtBookApi.remove(id),
    // A 404 means it's already gone — refresh either way so the row disappears.
    onSettled: () => invalidate(qc),
  })
}
