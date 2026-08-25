<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Smartphone, Headphones, Phone, Undo2, Pencil, X, Check } from 'lucide-vue-next'
import { useSale, useSaleReturns, useUpdateSale } from '@/composables/useSales'
import { createDebtState, validateDebt, buildDebt } from '@/composables/useSaleDebt'
import { formatMoney, formatDateTime, formatDate, formatPhone, toDateInputValue } from '@/lib/format'
import { saleStatus } from '@/lib/labels'
import { normalizeError, mapErrorCode, toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ReturnSheet from '@/components/sales/ReturnSheet.vue'
import DebtBlock from '@/components/sales/DebtBlock.vue'
import DebtDetailCard from '@/components/debts/DebtDetailCard.vue'
import PayDebtSheet from '@/components/debts/PayDebtSheet.vue'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: sale, isLoading, isError, error, refetch } = useSale(id)
const { data: returns } = useSaleReturns(id)
const updateSale = useUpdateSale()

const showReturn = ref(false)
const showPay = ref(false)

const canReturn = computed(
  () => !!sale.value && sale.value.items.some((i) => i.quantity - i.returnedQuantity > 0),
)
/**
 * Prices can be corrected on ANY sale now — the backend supports editing sales
 * with returns and with paid-down debt (it recomputes and enforces
 * total ≥ already-collected). So the button shows whenever a sale is loaded.
 */
const canEditPrice = computed(() => !!sale.value)
/** Installments already collected on this sale's debt — caps the remaining debt. */
const paidTotal = computed(() => sale.value?.debt?.paidTotal ?? 0)
/** Remaining debt on this sale (falls back to the initial debt if `debt` is absent). */
const remainingDebt = computed(() => sale.value?.debt?.amount ?? sale.value?.debtAmount ?? 0)
/** Customer card is shown for non-debt sales (the debt card already surfaces the customer). */
const showCustomer = computed(
  () => !sale.value?.debt && !!(sale.value?.customerName || sale.value?.customerPhone),
)

/* ----------------------------------------------------------------------------
 * Inline price-edit mode
 * ------------------------------------------------------------------------- */
const editing = ref(false)
/** Edited unit price per sale-item id — covers BOTH phone and accessory lines. */
const prices = reactive<Record<string, number | null>>({})
/** Debt block state — prefilled & kept open when the sale already has a debt. */
const debt = createDebtState()
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

/** New total = Σ (edited unitPrice × quantity); mirrors the server's recompute. */
const liveTotal = computed(() =>
  (sale.value?.items ?? []).reduce((sum, it) => sum + (prices[it.id] ?? 0) * it.quantity, 0),
)
/** Only the lines whose price actually changed get sent to the server. */
const changedItems = computed(() =>
  (sale.value?.items ?? [])
    .filter((it) => (prices[it.id] ?? 0) !== it.unitPrice)
    .map((it) => ({ id: it.id, unitPrice: prices[it.id] as number })),
)
const hasPriceChange = computed(() => changedItems.value.length > 0)
const allPricesValid = computed(() =>
  (sale.value?.items ?? []).every((it) => (prices[it.id] ?? 0) > 0),
)

function startEdit() {
  if (!sale.value) return
  Object.keys(errors).forEach((k) => delete errors[k])
  sale.value.items.forEach((it) => {
    prices[it.id] = it.unitPrice
  })
  const d = sale.value.debt
  debt.enabled = !!d
  debt.amount = d?.amount ?? null
  debt.dueDate = toDateInputValue(d?.dueDate)
  debt.customerName = d?.customerName ?? ''
  debt.customerPhone = d?.customerPhone ?? ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function save() {
  if (!sale.value) return
  if (!hasPriceChange.value) {
    notify.error(t('sales.noChanges'))
    return
  }
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!allPricesValid.value) errors.price = t('validation.positive')
  Object.assign(errors, validateDebt(debt, liveTotal.value, paidTotal.value))
  if (Object.keys(errors).length) {
    const first = Object.values(errors)[0]
    if (first) notify.error(first)
    return
  }
  submitting.value = true
  try {
    await updateSale.mutateAsync({
      id: sale.value.id,
      payload: {
        items: changedItems.value,
        // A debt sale must ALWAYS resend its debt — omitting it makes the
        // server clear the debt and convert the sale to full cash.
        debt: buildDebt(debt) ?? null,
      },
    })
    notify.success(t('sales.priceUpdated'))
    editing.value = false
  } catch (err) {
    handleError(err)
  } finally {
    submitting.value = false
  }
}

function handleError(err: unknown) {
  const e = normalizeError(err)
  const msg = mapErrorCode(e.code, e.details)
  // SALE_TOTAL_BELOW_COLLECTED is a price problem; the rest map to their fields.
  if (e.code === 'DEBT_EXCEEDS_TOTAL') errors.amount = msg
  else if (e.code === 'DUE_DATE_IN_PAST') errors.dueDate = msg
  else if (e.code === 'CUSTOMER_REQUIRED_FOR_DEBT') errors.customer = msg
  else if (e.code === 'SALE_TOTAL_BELOW_COLLECTED') errors.price = msg
  notify.error(msg)
}

// Auto-open edit mode when arrived from a phone/accessory page (`?edit=1`).
watch(sale, (s) => {
  if (s && route.query.edit === '1' && !editing.value) startEdit()
})
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

          <!-- Line items (with inline price editing) -->
          <div>
            <div class="mb-2 flex items-center justify-between px-1">
              <h3 class="text-sm font-semibold text-fg-muted">{{ t('sales.lineItems') }}</h3>
              <span v-if="editing" class="text-xs font-medium text-primary">
                {{ t('sales.editPrice') }}
              </span>
            </div>
            <Card :padded="false" class="overflow-hidden">
              <div
                v-for="(item, i) in sale.items"
                :key="item.id"
                class="px-4 py-3"
                :class="i > 0 ? 'border-t border-border' : ''"
              >
                <div class="flex gap-3">
                  <div
                    class="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-muted"
                  >
                    <component
                      :is="
                        item.itemType === 'PHONE'
                          ? Smartphone
                          : item.itemType === 'KEYPAD_PHONE'
                            ? Phone
                            : Headphones
                      "
                      class="size-5"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-fg">{{ item.product.name }}</p>
                    <p class="text-xs text-fg-muted tnum">
                      <!-- Phone: IMEI / memory · Accessory: quantity -->
                      <template v-if="item.itemType === 'PHONE'">
                        {{ item.product.imei || item.product.memory || '—' }}
                      </template>
                      <template v-else>{{ item.quantity }} {{ t('accessories.unit') }}</template>
                      <span v-if="!editing"> · {{ formatMoney(item.unitPrice) }}</span>
                      <span v-if="item.returnedQuantity > 0" class="text-danger">
                        · {{ t('sales.returnedQty') }}: {{ item.returnedQuantity }}
                      </span>
                    </p>
                  </div>
                  <span v-if="!editing" class="shrink-0 font-semibold text-fg tnum">
                    {{ formatMoney(item.lineTotal) }}
                  </span>
                </div>

                <!-- Editable price — rendered for EVERY line (phone & accessory) -->
                <div v-if="editing" class="mt-3 flex items-end gap-3">
                  <div class="flex-1">
                    <MoneyInput
                      v-model="prices[item.id]"
                      :label="item.itemType === 'PHONE' ? t('sales.price') : t('sales.unitPrice')"
                      :error="(prices[item.id] ?? 0) > 0 ? undefined : errors.price"
                    />
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="text-xs text-fg-muted">{{ t('sales.lineTotal') }}</p>
                    <p class="font-semibold text-fg tnum">
                      {{ formatMoney((prices[item.id] ?? 0) * item.quantity) }}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- Edit mode: live total + debt block + save/cancel -->
          <template v-if="editing">
            <div
              class="flex items-center justify-between rounded-2xl border border-border bg-surface-2/40 px-4 py-3"
            >
              <span class="text-sm text-fg-muted">{{ t('sales.newTotal') }}</span>
              <span class="text-lg font-extrabold text-fg tnum">{{ formatMoney(liveTotal) }}</span>
            </div>

            <!-- A debt sale keeps its debt block open & prefilled so it's re-sent.
                 `alreadyPaid` surfaces jami / to'langan / qoldiq for paid-down debts. -->
            <DebtBlock :state="debt" :total="liveTotal" :errors="errors" :already-paid="paidTotal" />

            <div class="flex gap-3">
              <AppButton variant="secondary" size="lg" block @click="cancelEdit">
                <template #icon><X class="size-5" /></template>
                {{ t('app.cancel') }}
              </AppButton>
              <AppButton
                size="lg"
                block
                :loading="submitting"
                :disabled="!hasPriceChange"
                @click="save"
              >
                <template #icon><Check class="size-5" /></template>
                {{ t('sales.saveChanges') }}
              </AppButton>
            </div>
          </template>

          <template v-else>
            <!-- Customer (non-debt sales) -->
            <div v-if="showCustomer">
              <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
                {{ t('sales.customer') }}
              </h3>
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

            <!-- Actions -->
            <div v-if="canEditPrice || canReturn" class="space-y-3">
              <AppButton
                v-if="canEditPrice"
                variant="secondary"
                size="lg"
                block
                @click="startEdit"
              >
                <template #icon><Pencil class="size-5" /></template>
                {{ t('sales.editPrice') }}
              </AppButton>
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
          </template>
        </div>
      </DataState>
    </PageContainer>

    <ReturnSheet v-if="sale" v-model="showReturn" :sale="sale" />
    <PayDebtSheet v-if="sale?.debt" v-model="showPay" :debt="sale.debt" @paid="refetch" />
  </div>
</template>
