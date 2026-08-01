<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { HandCoins } from 'lucide-vue-next'
import type { Debt, DebtListQuery, DebtStatus } from '@/api/types'
import { useDebtsList } from '@/composables/useDebts'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import ChipGroup from '@/components/ui/ChipGroup.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import DebtCard from '@/components/debts/DebtCard.vue'
import PayDebtSheet from '@/components/debts/PayDebtSheet.vue'
import ExtendDebtSheet from '@/components/debts/ExtendDebtSheet.vue'

const router = useRouter()

const filters = reactive<{ status: DebtStatus | undefined; overdue: boolean; search: string }>({
  status: 'OPEN',
  overdue: false,
  search: '',
})

const query = computed<DebtListQuery>(() => ({
  status: filters.status,
  overdue: filters.overdue || undefined,
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
} = useDebtsList(query)

const statusOptions = [
  { label: t('debts.statusOpen'), value: 'OPEN' as const },
  { label: t('debts.statusPaid'), value: 'PAID' as const },
]

const selected = ref<Debt | null>(null)
const showPay = ref(false)
const showExtend = ref(false)

function onPay(debt: Debt) {
  selected.value = debt
  showPay.value = true
}
function onExtend(debt: Debt) {
  selected.value = debt
  showExtend.value = true
}
function openSale(debt: Debt) {
  router.push({ name: 'sale-detail', params: { id: debt.saleId } })
}
</script>

<template>
  <div>
    <PageHeader :title="t('debts.title')" back />
    <PageContainer>
      <div class="space-y-3">
        <SearchBar v-model="filters.search" />
        <div class="flex flex-wrap items-center gap-2">
          <ChipGroup v-model="filters.status" :options="statusOptions" />
          <button
            type="button"
            class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              filters.overdue
                ? 'border-danger bg-danger text-white'
                : 'border-border bg-surface text-fg-muted hover:text-fg'
            "
            @click="filters.overdue = !filters.overdue"
          >
            {{ t('debts.overdueOnly') }}
          </button>
        </div>
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
            <SkeletonBlock v-for="i in 4" :key="i" class="h-40 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="HandCoins"
            :title="t('debts.emptyTitle')"
            :text="t('debts.emptyText')"
          />
        </template>

        <TransitionGroup tag="div" name="list" class="space-y-3">
          <DebtCard
            v-for="debt in items"
            :key="debt.id"
            :debt="debt"
            @pay="onPay(debt)"
            @extend="onExtend(debt)"
            @open-sale="openSale(debt)"
          />
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!hasNextPage"
          :loading="isFetchingNextPage"
          @load="fetchNextPage()"
        />
      </DataState>
    </PageContainer>

    <PayDebtSheet v-if="selected" v-model="showPay" :debt="selected" />
    <ExtendDebtSheet v-if="selected" v-model="showExtend" :debt="selected" />
  </div>
</template>
