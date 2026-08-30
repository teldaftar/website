<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, PackagePlus } from 'lucide-vue-next'
import type { StockReceiptListQuery, StockReceiptRow } from '@/api/types'
import { useStockReceiptsList } from '@/composables/useStockReceipts'
import { toUserMessage } from '@/api/errors'
import { currentMonthRange, dayKey, formatDate, formatMoney } from '@/lib/format'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DateRangePicker, { type DateRange } from '@/components/ui/DateRangePicker.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ReceiptCard from '@/components/receipts/ReceiptCard.vue'

const router = useRouter()

const range = ref<DateRange>(currentMonthRange())
const filters = reactive({ search: '' })

const query = computed<StockReceiptListQuery>(() => ({
  from: range.value.from,
  to: range.value.to,
  search: filters.search.trim() || undefined,
}))

const {
  items,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
} = useStockReceiptsList(query)

// Dim (not blank) the list while a filter/search change is refetching — the
// previous results stay on screen thanks to keepPreviousData.
const isRefreshing = computed(
  () => isFetching.value && !isLoading.value && !isFetchingNextPage.value,
)

const todayKey = dayKey(new Date())
const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000))

/** Group the (already date-DESC) list into day sections, newest day first. */
const groups = computed(() => {
  const map = new Map<string, { key: string; rows: StockReceiptRow[]; total: number }>()
  for (const row of items.value) {
    const key = dayKey(row.receivedAt)
    let group = map.get(key)
    if (!group) {
      group = { key, rows: [], total: 0 }
      map.set(key, group)
    }
    group.rows.push(row)
    group.total += row.totalAmount
  }
  return [...map.values()]
})

function dayLabel(key: string): string {
  if (key === todayKey) return t('app.today')
  if (key === yesterdayKey) return t('receipts.yesterday')
  return formatDate(key)
}

function openNew() {
  router.push({ name: 'receipt-new' })
}
function open(id: string) {
  router.push({ name: 'receipt-detail', params: { id } })
}
</script>

<template>
  <div>
    <PageHeader :title="t('receipts.title')" back>
      <template #actions>
        <AppButton size="sm" @click="openNew">
          <template #icon><Plus class="size-4" /></template>
          {{ t('receipts.new') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageContainer wide>
      <div class="space-y-3">
        <DateRangePicker v-model="range" />
        <SearchBar v-model="filters.search" />
      </div>

      <DataState
        class="mt-4"
        :loading="isLoading"
        :is-error="isError"
        :is-empty="items.length === 0"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-6">
            <div v-for="g in 2" :key="g" class="space-y-3">
              <div class="flex items-center justify-between px-1">
                <SkeletonBlock class="h-4 w-24 rounded-md" />
                <SkeletonBlock class="h-4 w-20 rounded-md" />
              </div>
              <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SkeletonBlock v-for="i in 2" :key="i" class="h-24 rounded-2xl" />
              </div>
            </div>
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="PackagePlus"
            :title="t('receipts.emptyTitle')"
            :text="t('receipts.emptyText')"
          >
            <template #action>
              <AppButton @click="openNew">{{ t('receipts.new') }}</AppButton>
            </template>
          </EmptyState>
        </template>

        <TransitionGroup
          tag="div"
          name="list"
          class="space-y-6"
          :class="{ 'pointer-events-none opacity-60 transition-opacity': isRefreshing }"
        >
          <section v-for="group in groups" :key="group.key" class="space-y-3">
            <div class="flex items-baseline justify-between gap-3 px-1">
              <h3 class="min-w-0 text-sm font-bold text-fg">
                <span>{{ dayLabel(group.key) }}</span>
                <span class="mx-1.5 text-fg-muted">—</span>
                <span class="text-primary tnum">{{ formatMoney(group.total) }}</span>
              </h3>
              <span class="shrink-0 text-xs text-fg-muted">
                {{ t('receipts.dayReceipts', { n: group.rows.length }) }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ReceiptCard
                v-for="row in group.rows"
                :key="row.id"
                :row="row"
                @open="open(row.id)"
              />
            </div>
          </section>
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!hasNextPage"
          :loading="isFetchingNextPage"
          @load="fetchNextPage()"
        />
      </DataState>
    </PageContainer>
  </div>
</template>
