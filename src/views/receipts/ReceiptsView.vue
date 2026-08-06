<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, PackagePlus } from 'lucide-vue-next'
import type { StockReceiptListQuery } from '@/api/types'
import { useStockReceiptsList } from '@/composables/useStockReceipts'
import { toUserMessage } from '@/api/errors'
import { currentMonthRange } from '@/lib/format'
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
} = useStockReceiptsList(query)

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
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SkeletonBlock v-for="i in 6" :key="i" class="h-24 rounded-2xl" />
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

        <TransitionGroup tag="div" name="list" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ReceiptCard v-for="row in items" :key="row.id" :row="row" @open="open(row.id)" />
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
