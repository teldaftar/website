import { api } from './http'
import type { DailyStat, StatisticsSummary, StatRangeQuery } from './types'

export const statisticsApi = {
  summary(query: StatRangeQuery) {
    return api.get<StatisticsSummary>('/statistics/summary', { params: query }).then((r) => r.data)
  },
  daily(query: StatRangeQuery) {
    return api.get<DailyStat[]>('/statistics/daily', { params: query }).then((r) => r.data)
  },
}
