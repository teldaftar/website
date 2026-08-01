import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/vue-query'
import type { Paginated } from '@/api/types'

interface PageQuery {
  page?: number
  limit?: number
}

/**
 * Generic list hook over the backend's `{ data, meta }` pagination. Uses an
 * infinite query so the same source powers both mobile infinite-scroll and a
 * "load more" affordance. Filters are reactive — changing them refetches from
 * page 1 automatically (they're part of the query key).
 */
export function usePaginatedList<T, F extends PageQuery>(
  key: string,
  fetcher: (query: F) => Promise<Paginated<T>>,
  filters: MaybeRefOrGetter<F>,
  limit = 20,
) {
  const query = useInfiniteQuery<
    Paginated<T>,
    Error,
    InfiniteData<Paginated<T>>,
    readonly unknown[],
    number
  >({
    queryKey: [key, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetcher({ ...toValue(filters), page: pageParam, limit } as F),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  })

  const items = computed<T[]>(() => query.data.value?.pages.flatMap((p) => p.data) ?? [])
  const total = computed(() => query.data.value?.pages[0]?.meta.total ?? 0)

  return {
    items,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetching: query.isFetching,
  }
}
