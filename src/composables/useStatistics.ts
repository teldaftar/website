import { toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { statisticsApi } from '@/api/statistics'
import type { StatRangeQuery } from '@/api/types'

export function useStatisticsSummary(range: MaybeRefOrGetter<StatRangeQuery>) {
  return useQuery({
    queryKey: ['statistics', 'summary', range],
    queryFn: () => statisticsApi.summary(toValue(range)),
  })
}

export function useDailyStats(range: MaybeRefOrGetter<StatRangeQuery>) {
  return useQuery({
    queryKey: ['statistics', 'daily', range],
    queryFn: () => statisticsApi.daily(toValue(range)),
  })
}
