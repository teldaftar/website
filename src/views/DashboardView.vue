<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Headphones,
  Phone,
  ChevronRight,
  AlertTriangle,
  HandCoins,
  ShoppingCart,
} from 'lucide-vue-next'
import { useStatisticsSummary, useDailyStats } from '@/composables/useStatistics'
import { toUserMessage } from '@/api/errors'
import { formatMoney, formatNumber, currentMonthRange } from '@/lib/format'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import DateRangePicker, { type DateRange } from '@/components/ui/DateRangePicker.vue'
import PullToRefresh from '@/components/ui/PullToRefresh.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import StatTile from '@/components/ui/StatTile.vue'
import Card from '@/components/ui/Card.vue'
import StatChart from '@/components/dashboard/StatChart.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const range = ref<DateRange>(currentMonthRange())
const rangeQuery = computed(() => ({ from: range.value.from, to: range.value.to }))

const summaryQ = useStatisticsSummary(rangeQuery)
const dailyQ = useDailyStats(rangeQuery)

const s = computed(() => summaryQ.data.value)

function refresh() {
  return Promise.all([summaryQ.refetch(), dailyQ.refetch()])
}
</script>

<template>
  <div>
    <PageHeader :title="t('dashboard.title')" />
    <PageContainer wide>
      <AppButton size="lg" block class="mb-4" @click="router.push({ name: 'sale-new' })">
        <template #icon><ShoppingCart class="size-5" /></template>
        {{ t('sales.title') }}
      </AppButton>

      <div class="mb-4">
        <DateRangePicker v-model="range" />
      </div>

      <PullToRefresh :on-refresh="refresh">
        <DataState
          :loading="summaryQ.isLoading.value"
          :is-error="summaryQ.isError.value"
          :is-empty="false"
          :error-message="summaryQ.error.value ? toUserMessage(summaryQ.error.value) : undefined"
          @retry="summaryQ.refetch()"
        >
          <template #skeleton>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SkeletonBlock v-for="i in 4" :key="i" class="h-24 rounded-2xl" />
              </div>
              <SkeletonBlock class="h-64 rounded-2xl" />
            </div>
          </template>

          <div v-if="s" class="space-y-5">
            <!-- Headline totals -->
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                :label="t('dashboard.grossProfit')"
                :value="s.totals.grossProfit"
                :icon="TrendingUp"
                tone="success"
              />
              <StatTile
                :label="t('dashboard.netProfit')"
                :value="s.totals.netProfit"
                :icon="Wallet"
                tone="primary"
              />
              <StatTile
                :label="t('dashboard.cashIn')"
                :value="s.totals.cashIn"
                :icon="ArrowDownLeft"
                tone="info"
              />
              <StatTile
                :label="t('dashboard.cashOut')"
                :value="s.totals.cashOut"
                :icon="ArrowUpRight"
                tone="danger"
              />
            </div>

            <!-- Per-category profit -->
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatTile
                :label="t('dashboard.phonesProfit')"
                :value="s.phones.profit"
                :icon="Smartphone"
                tone="neutral"
                :hint="`${formatNumber(s.phones.soldCount)} ${t('accessories.unit')}`"
              />
              <StatTile
                :label="t('dashboard.accessoriesProfit')"
                :value="s.accessories.profit"
                :icon="Headphones"
                tone="neutral"
                :hint="`${formatNumber(s.accessories.soldQty)} ${t('accessories.unit')}`"
              />
              <StatTile
                v-if="s.keypadPhones"
                :label="t('dashboard.keypadProfit')"
                :value="s.keypadPhones.profit"
                :icon="Phone"
                tone="neutral"
                :hint="`${formatNumber(s.keypadPhones.soldQty)} ${t('accessories.unit')}`"
              />
            </div>

            <!-- Current snapshot (NOT range-bound) -->
            <Card>
              <div class="mb-3 flex items-center gap-2">
                <h3 class="text-sm font-semibold text-fg">
                  {{ t('dashboard.currentStateTitle') }}
                </h3>
                <span
                  class="rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-medium text-info"
                >
                  {{ t('dashboard.currentState') }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p class="text-fg-muted">{{ t('dashboard.inStockCount') }}</p>
                  <p class="font-bold text-fg tnum">{{ formatNumber(s.phones.inStockCount) }}</p>
                </div>
                <div>
                  <p class="text-fg-muted">{{ t('dashboard.inStockCost') }}</p>
                  <p class="font-bold text-fg tnum">
                    {{ formatMoney(s.phones.inStockCostAmount) }}
                  </p>
                </div>
                <div>
                  <p class="text-fg-muted">{{ t('dashboard.remainingQty') }}</p>
                  <p class="font-bold text-fg tnum">
                    {{ formatNumber(s.accessories.remainingQty) }}
                  </p>
                </div>
                <div>
                  <p class="text-fg-muted">{{ t('dashboard.remainingCost') }}</p>
                  <p class="font-bold text-fg tnum">
                    {{ formatMoney(s.accessories.remainingCostAmount) }}
                  </p>
                </div>
                <template v-if="s.keypadPhones">
                  <div>
                    <p class="text-fg-muted">{{ t('dashboard.keypadRemainingQty') }}</p>
                    <p class="font-bold text-fg tnum">
                      {{ formatNumber(s.keypadPhones.remainingQty) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-fg-muted">{{ t('dashboard.keypadRemainingCost') }}</p>
                    <p class="font-bold text-fg tnum">
                      {{ formatMoney(s.keypadPhones.remainingCostAmount) }}
                    </p>
                  </div>
                </template>
              </div>
            </Card>

            <!-- Debts summary -->
            <button class="w-full text-left" @click="router.push({ name: 'debts' })">
              <Card interactive>
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-fg">{{ t('dashboard.debtsTitle') }}</h3>
                  <span class="flex items-center gap-1 text-xs text-primary">
                    {{ t('dashboard.viewDebtors') }} <ChevronRight class="size-4" />
                  </span>
                </div>
                <div class="mt-3 flex items-center gap-3 rounded-xl bg-success-soft p-3">
                  <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
                    <HandCoins class="size-5" />
                  </span>
                  <div>
                    <p class="text-xs text-success">{{ t('dashboard.debtCollected') }}</p>
                    <p class="font-bold text-success tnum">
                      {{ formatMoney(s.debts.collectedInRange) }}
                    </p>
                  </div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-surface-2 p-3">
                    <p class="text-xs text-fg-muted">{{ t('dashboard.openDebts') }}</p>
                    <p class="mt-0.5 font-bold text-fg tnum">
                      {{ formatMoney(s.debts.openAmount) }}
                    </p>
                    <p class="text-xs text-fg-muted">{{ s.debts.openCount }} ta</p>
                  </div>
                  <div
                    class="rounded-xl p-3"
                    :class="s.debts.overdueCount > 0 ? 'bg-danger-soft' : 'bg-surface-2'"
                  >
                    <p
                      class="flex items-center gap-1 text-xs"
                      :class="s.debts.overdueCount > 0 ? 'text-danger' : 'text-fg-muted'"
                    >
                      <AlertTriangle v-if="s.debts.overdueCount > 0" class="size-3" />
                      {{ t('dashboard.overdueDebts') }}
                    </p>
                    <p
                      class="mt-0.5 font-bold tnum"
                      :class="s.debts.overdueCount > 0 ? 'text-danger' : 'text-fg'"
                    >
                      {{ formatMoney(s.debts.overdueAmount) }}
                    </p>
                    <p class="text-xs text-fg-muted">{{ s.debts.overdueCount }} ta</p>
                  </div>
                </div>
              </Card>
            </button>

            <!-- Chart -->
            <Card>
              <h3 class="mb-3 text-sm font-semibold text-fg">{{ t('dashboard.chartTitle') }}</h3>
              <StatChart
                v-if="dailyQ.data.value && dailyQ.data.value.length"
                :daily="dailyQ.data.value"
              />
              <div v-else class="grid h-56 place-items-center text-sm text-fg-muted">—</div>
            </Card>
          </div>
        </DataState>
      </PullToRefresh>
    </PageContainer>
  </div>
</template>
