<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Smartphone, Headphones, Undo2 } from 'lucide-vue-next'
import { useSale, useSaleReturns } from '@/composables/useSales'
import { formatMoney, formatDateTime, formatDate, formatPhone } from '@/lib/format'
import { saleStatus } from '@/lib/labels'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ReturnSheet from '@/components/sales/ReturnSheet.vue'
import DebtDetailCard from '@/components/debts/DebtDetailCard.vue'
import PayDebtSheet from '@/components/debts/PayDebtSheet.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: sale, isLoading, isError, error, refetch } = useSale(id)
const { data: returns } = useSaleReturns(id)

const showReturn = ref(false)
const showPay = ref(false)

const canReturn = computed(
  () => !!sale.value && sale.value.items.some((i) => i.quantity - i.returnedQuantity > 0),
)
/** Remaining debt on this sale (falls back to the initial debt if `debt` is absent). */
const remainingDebt = computed(() => sale.value?.debt?.amount ?? sale.value?.debtAmount ?? 0)
/** Customer card is shown for non-debt sales (the debt card already surfaces the customer). */
const showCustomer = computed(
  () => !sale.value?.debt && !!(sale.value?.customerName || sale.value?.customerPhone),
)
</script>

<template>
  <div>
    <PageHeader :title="sale?.code ?? t('sales.title')" back />
    <PageContainer>
      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="false"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-4">
            <SkeletonBlock class="h-32 rounded-2xl" />
            <SkeletonBlock class="h-40 rounded-2xl" />
          </div>
        </template>

        <div v-if="sale" class="space-y-4">
          <!-- Header card -->
          <Card>
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-2xl font-extrabold text-fg tnum">{{ sale.code }}</p>
                <p class="text-sm text-fg-muted">{{ formatDateTime(sale.soldAt) }}</p>
              </div>
              <Badge :tone="saleStatus(sale.status).tone">{{
                saleStatus(sale.status).label
              }}</Badge>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-surface-2 p-3">
                <p class="text-fg-muted">{{ t('sales.total') }}</p>
                <p class="mt-0.5 font-bold text-fg tnum">{{ formatMoney(sale.totalAmount) }}</p>
              </div>
              <div class="rounded-xl bg-surface-2 p-3">
                <p class="text-fg-muted">{{ t('sales.profit') }}</p>
                <p class="mt-0.5 font-bold text-success tnum">{{ formatMoney(sale.profit) }}</p>
              </div>
              <div class="rounded-xl bg-surface-2 p-3">
                <p class="text-fg-muted">{{ t('sales.paid') }}</p>
                <p class="mt-0.5 font-semibold text-fg tnum">{{ formatMoney(sale.paidAmount) }}</p>
              </div>
              <div v-if="remainingDebt > 0" class="rounded-xl bg-warning-soft p-3">
                <p class="text-warning">{{ t('debts.remaining') }}</p>
                <p class="mt-0.5 font-semibold text-warning tnum">
                  {{ formatMoney(remainingDebt) }}
                </p>
              </div>
            </div>
          </Card>

          <!-- Line items -->
          <div>
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
              {{ t('sales.lineItems') }}
            </h3>
            <Card :padded="false" class="overflow-hidden">
              <div
                v-for="(item, i) in sale.items"
                :key="item.id"
                class="flex gap-3 px-4 py-3"
                :class="i > 0 ? 'border-t border-border' : ''"
              >
                <div
                  class="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-muted"
                >
                  <component :is="sale.type === 'PHONE' ? Smartphone : Headphones" class="size-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-fg">{{ item.product.name }}</p>
                  <p class="text-xs text-fg-muted">
                    {{ item.quantity }} × {{ formatMoney(item.unitPrice) }}
                    <span v-if="item.returnedQuantity > 0" class="text-danger">
                      · {{ t('sales.returnedQty') }}: {{ item.returnedQuantity }}
                    </span>
                  </p>
                </div>
                <span class="shrink-0 font-semibold text-fg tnum">{{
                  formatMoney(item.lineTotal)
                }}</span>
              </div>
            </Card>
          </div>

          <!-- Customer (non-debt sales) -->
          <div v-if="showCustomer">
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('sales.customer') }}</h3>
            <Card>
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p v-if="sale.customerName" class="font-semibold text-fg">
                    {{ sale.customerName }}
                  </p>
                  <p v-if="sale.customerPhone" class="text-sm text-fg-muted tnum">
                    {{ formatPhone(sale.customerPhone) }}
                  </p>
                </div>
                <a
                  v-if="sale.customerPhone"
                  :href="`tel:${sale.customerPhone}`"
                  class="shrink-0 text-sm font-medium text-primary"
                >
                  {{ t('app.call') }}
                </a>
              </div>
            </Card>
          </div>

          <!-- Debt block -->
          <div v-if="sale.debt">
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('nav.debts') }}</h3>
            <DebtDetailCard :debt="sale.debt" @pay="showPay = true" />
          </div>

          <!-- Returns list -->
          <div v-if="returns && returns.length">
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('returns.list') }}</h3>
            <Card :padded="false" class="overflow-hidden">
              <div
                v-for="(r, i) in returns"
                :key="r.id"
                class="flex items-center justify-between gap-3 px-4 py-3"
                :class="i > 0 ? 'border-t border-border' : ''"
              >
                <div class="min-w-0">
                  <p class="font-medium text-fg">−{{ r.quantity }} {{ t('accessories.unit') }}</p>
                  <p v-if="r.reason" class="truncate text-xs text-fg-muted">{{ r.reason }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-danger tnum">{{ formatMoney(r.amount) }}</p>
                  <p class="text-xs text-fg-muted">{{ formatDate(r.createdAt) }}</p>
                </div>
              </div>
            </Card>
          </div>

          <AppButton
            v-if="canReturn"
            variant="secondary"
            size="lg"
            block
            @click="showReturn = true"
          >
            <template #icon><Undo2 class="size-5" /></template>
            {{ t('returns.action') }}
          </AppButton>
        </div>
      </DataState>
    </PageContainer>

    <ReturnSheet v-if="sale" v-model="showReturn" :sale="sale" />
    <PayDebtSheet v-if="sale?.debt" v-model="showPay" :debt="sale.debt" @paid="refetch" />
  </div>
</template>
