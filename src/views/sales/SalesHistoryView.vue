<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Receipt, Plus } from 'lucide-vue-next'
import type { SaleListQuery, SaleType } from '@/api/types'
import { useSalesList } from '@/composables/useSales'
import { toUserMessage } from '@/api/errors'
import { currentMonthRange } from '@/lib/format'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Segmented from '@/components/ui/Segmented.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DateRangePicker, { type DateRange } from '@/components/ui/DateRangePicker.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import SaleRow from '@/components/sales/SaleRow.vue'

const router = useRouter()

// 'ALL' = no type filter, so mixed (phone + accessory) sales are visible too.
const type = ref<SaleType | 'ALL'>('ALL')
const range = ref<DateRange>(currentMonthRange())
const filters = reactive({ search: '', isDebt: false })

const query = computed<SaleListQuery>(() => ({
  type: type.value === 'ALL' ? undefined : type.value,
  from: range.value.from,
  to: range.value.to,
  search: filters.search.trim() || undefined,
  isDebt: filters.isDebt || undefined,
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
} = useSalesList(query)

const typeOptions = [
  { label: t('sales.tabAll'), value: 'ALL' as const },
  { label: t('sales.tabPhones'), value: 'PHONE' as const },
  { label: t('sales.tabAccessories'), value: 'ACCESSORY' as const },
  { label: t('sales.tabKeypad'), value: 'KEYPAD_PHONE' as const },
]
</script>

<template>
  <div>
    <PageHeader :title="t('sales.history')" back>
      <template #actions>
        <AppButton size="sm" @click="router.push({ name: 'sale-new' })">
          <template #icon><Plus class="size-4" /></template>
          {{ t('sales.title') }}
        </AppButton>
      </template>
    </PageHeader>
    <PageContainer>
      <div class="space-y-3">
        <Segmented v-model="type" :options="typeOptions" />
        <DateRangePicker v-model="range" />
        <SearchBar v-model="filters.search" />
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="
            filters.isDebt
              ? 'border-primary bg-primary text-primary-fg'
              : 'border-border bg-surface text-fg-muted hover:text-fg'
          "
          @click="filters.isDebt = !filters.isDebt"
        >
          {{ t('sales.onlyDebt') }}
        </button>
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
          <div class="space-y-3">
            <SkeletonBlock v-for="i in 5" :key="i" class="h-28 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState :icon="Receipt" :title="t('sales.emptyTitle')" :text="t('sales.emptyText')" />
        </template>

        <TransitionGroup tag="div" name="list" class="space-y-3">
          <button
            v-for="sale in items"
            :key="sale.id"
            class="block w-full text-left"
            @click="router.push({ name: 'sale-detail', params: { id: sale.id } })"
          >
            <SaleRow :sale="sale" />
          </button>
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
