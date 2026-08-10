<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Check,
  Receipt,
  Plus,
  Smartphone,
  Headphones,
  Trash2,
  ShoppingCart,
  Layers,
} from 'lucide-vue-next'
import type { Accessory, Phone, Sale } from '@/api/types'
import { phonesApi } from '@/api/phones'
import { accessoriesApi } from '@/api/accessories'
import { useSaleCart, lineTotal, accessoryAvailable } from '@/composables/useSaleCart'
import { useCreateSale } from '@/composables/useSales'
import { createDebtState, validateDebt, buildDebt } from '@/composables/useSaleDebt'
import { normalizeError, mapErrorCode, toUserMessage } from '@/api/errors'
import { formatMoney, formatCost, formatMemory, normalizePhone, resolveImageUrl } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import Card from '@/components/ui/Card.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DebtBlock from '@/components/sales/DebtBlock.vue'
import PhonePickerSheet from '@/components/sales/PhonePickerSheet.vue'
import AccessoryPickerSheet from '@/components/sales/AccessoryPickerSheet.vue'

const router = useRouter()
const route = useRoute()
const createSale = useCreateSale()
const cart = useSaleCart()
const { lines, total, isEmpty, linesValid } = cart

// "Already added" id lists the pickers use to disable duplicate phones / accessories.
const addedPhoneIds = computed(() =>
  lines.value.filter((l) => l.type === 'PHONE').map((l) => l.phone.id),
)
const addedAccessoryIds = computed(() =>
  lines.value.filter((l) => l.type === 'ACCESSORY').map((l) => l.accessory.id),
)

const note = ref('')
const customerName = ref('')
const customerPhone = ref('')
const debt = createDebtState()
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const done = ref<Sale | null>(null)

const showPhonePicker = ref(false)
const showAccessoryPicker = ref(false)

// An accessory line needs its available FIFO batches so the quantity can span
// several intakes; fetch them, then add one consolidated row.
async function addAccessoryLine(accessory: Accessory) {
  try {
    const batches = await accessoriesApi.stockHistory(accessory.id, { available: true })
    if (!batches.length) {
      notify.error(t('sales.noBatches'))
      return
    }
    cart.addAccessory(accessory, batches)
  } catch (err) {
    notify.error(toUserMessage(err))
  }
}

// Pre-add the product the user tapped "Sotish" on (both land straight in the cart).
onMounted(async () => {
  const phoneId = typeof route.query.phoneId === 'string' ? route.query.phoneId : null
  const accessoryId = typeof route.query.accessoryId === 'string' ? route.query.accessoryId : null
  if (!phoneId && !accessoryId) return
  // Drop the query so a reload / "Yana sotuv" doesn't re-trigger the pre-add.
  void router.replace({ name: 'sale-new' })
  try {
    if (phoneId) {
      cart.addPhone(await phonesApi.get(phoneId))
    } else if (accessoryId) {
      await addAccessoryLine(await accessoriesApi.get(accessoryId))
    }
  } catch {
    // Invalid or already-sold id — just land on the empty cart.
  }
})

function onPhone(phone: Phone) {
  cart.addPhone(phone)
}
function onAccessory(accessory: Accessory) {
  void addAccessoryLine(accessory)
}

function submit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  Object.assign(errors, validateDebt(debt, total.value))
  const firstError = Object.values(errors)[0]
  if (firstError) {
    notify.error(firstError)
    return
  }
  void doSubmit()
}

async function doSubmit() {
  submitting.value = true
  // Customer is entered directly only on non-debt sales; on debt sales the debt
  // block owns it and the backend fills these from the debt customer.
  const customer = debt.enabled
    ? {}
    : {
        customerName: customerName.value.trim() || undefined,
        customerPhone: normalizePhone(customerPhone.value) || undefined,
      }
  try {
    const sale = await createSale.mutateAsync({
      items: cart.toPayloadItems(),
      note: note.value.trim() || undefined,
      debt: buildDebt(debt),
      ...customer,
    })
    done.value = sale
  } catch (err) {
    handleError(err)
  } finally {
    submitting.value = false
  }
}

function handleError(err: unknown) {
  const e = normalizeError(err)
  const msg = mapErrorCode(e.code, e.details)
  if (e.code === 'DEBT_EXCEEDS_TOTAL') errors.amount = msg
  if (e.code === 'DUE_DATE_IN_PAST') errors.dueDate = msg
  if (e.code === 'CUSTOMER_REQUIRED_FOR_DEBT') errors.customer = msg
  notify.error(msg)
}

function reset() {
  done.value = null
  cart.clear()
  note.value = ''
  customerName.value = ''
  customerPhone.value = ''
  debt.enabled = false
  debt.amount = null
  debt.dueDate = ''
  debt.customerName = ''
  debt.customerPhone = ''
  Object.keys(errors).forEach((k) => delete errors[k])
}

function openReceipt() {
  const id = done.value?.id
  if (id) router.push({ name: 'sale-detail', params: { id } })
}
</script>

<template>
  <div>
    <PageHeader :title="t('sales.title')" back />
    <PageContainer wide>
      <!-- Success -->
      <div v-if="done" class="flex flex-col items-center py-6 text-center">
        <div
          v-motion-pop
          class="grid size-16 place-items-center rounded-full bg-success-soft text-success"
        >
          <Check class="size-9" :stroke-width="3" />
        </div>
        <h3 class="mt-4 text-lg font-bold text-fg">{{ t('sales.successTitle') }}</h3>
        <p class="mt-1 text-2xl font-extrabold tracking-wide text-primary tnum">{{ done.code }}</p>

        <div class="mt-5 w-full max-w-sm space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-fg-muted">{{ t('sales.total') }}</span>
            <span class="font-bold text-fg tnum">{{ formatMoney(done.totalAmount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-fg-muted">{{ t('sales.cash') }}</span>
            <span class="font-semibold text-success tnum">{{ formatMoney(done.paidAmount) }}</span>
          </div>
          <div v-if="done.debtAmount > 0" class="flex justify-between">
            <span class="text-fg-muted">{{ t('sales.remaining') }}</span>
            <span class="font-semibold text-warning tnum">{{ formatMoney(done.debtAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2">
            <span class="text-fg-muted">{{ t('sales.profit') }}</span>
            <span
              class="font-bold tnum"
              :class="done.profit < 0 ? 'text-danger' : 'text-success'"
            >
              {{ formatMoney(done.profit) }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex w-full max-w-sm gap-3">
          <AppButton variant="secondary" block @click="reset">
            <template #icon><Plus class="size-4" /></template>
            {{ t('sales.again') }}
          </AppButton>
          <AppButton block @click="openReceipt">
            <template #icon><Receipt class="size-4" /></template>
            {{ t('sales.receipt') }}
          </AppButton>
        </div>
      </div>

      <!-- Cart: products (left) + checkout (right) side-by-side on desktop,
           stacked with a divider on mobile. -->
      <div v-else class="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <!-- LEFT: add products + cart lines -->
        <section class="space-y-4">
          <!-- Add-product buttons -->
          <div class="grid grid-cols-2 gap-3">
            <AppButton variant="secondary" @click="showPhonePicker = true">
              <template #icon><Smartphone class="size-4" /></template>
              {{ t('sales.phone') }}
            </AppButton>
            <AppButton variant="secondary" @click="showAccessoryPicker = true">
              <template #icon><Headphones class="size-4" /></template>
              {{ t('sales.accessory') }}
            </AppButton>
          </div>

          <!-- Empty cart -->
          <EmptyState
            v-if="isEmpty"
            :icon="ShoppingCart"
            :title="t('sales.emptyCart')"
            :text="t('sales.emptyCartHint')"
          />

          <!-- Lines -->
          <div v-else class="space-y-3">
            <h3 class="px-1 text-sm font-semibold text-fg-muted">
              {{ t('sales.cart') }} · {{ lines.length }}
            </h3>
            <Card v-for="line in lines" :key="line.key" :padded="false" class="overflow-hidden">
              <div class="flex items-start gap-3 p-3">
                <div
                  class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
                >
                  <template v-if="line.type === 'PHONE'">
                    <img
                      v-if="resolveImageUrl(line.phone.imageUrl)"
                      :src="resolveImageUrl(line.phone.imageUrl) ?? ''"
                      alt=""
                      class="size-full object-cover"
                    />
                    <Smartphone v-else class="size-5 text-fg-muted" />
                  </template>
                  <template v-else>
                    <img
                      v-if="resolveImageUrl(line.accessory.imageUrl)"
                      :src="resolveImageUrl(line.accessory.imageUrl) ?? ''"
                      alt=""
                      class="size-full object-cover"
                    />
                    <Headphones v-else class="size-5 text-fg-muted" />
                  </template>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-fg">
                    {{ line.type === 'PHONE' ? line.phone.name : line.accessory.name }}
                  </p>
                  <template v-if="line.type === 'PHONE'">
                    <p class="truncate text-xs text-fg-muted">
                      {{
                        formatMemory(line.phone.ramGb, line.phone.storageGb) ||
                        line.phone.imei ||
                        '—'
                      }}
                    </p>
                    <p class="text-xs text-fg-muted tnum">
                      {{ t('phones.bought') }}: {{ formatCost(line.phone.purchasePrice) }}
                    </p>
                  </template>
                  <p v-else class="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted tnum">
                    <span class="inline-flex items-center gap-1">
                      <Layers class="size-3.5 shrink-0" />
                      {{ t('phones.bought') }}: {{ formatCost(line.accessory.purchasePrice) }}
                    </span>
                    <span class="text-fg-muted/70">·</span>
                    <span>
                      {{ accessoryAvailable(line) }} {{ t('accessories.unit') }}
                      {{ t('accessories.remaining').toLowerCase() }}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  class="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  :aria-label="t('app.delete')"
                  @click="cart.remove(line.key)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>

              <!-- Editable price / qty -->
              <div class="flex items-end gap-3 border-t border-border bg-surface-2/40 px-3 py-3">
                <QuantityStepper
                  v-if="line.type === 'ACCESSORY'"
                  v-model="line.quantity"
                  :label="t('sales.quantity')"
                  :min="1"
                  :max="accessoryAvailable(line)"
                  class="max-w-[9.5rem]"
                />
                <div class="flex-1">
                  <MoneyInput
                    v-model="line.unitPrice"
                    :label="line.type === 'PHONE' ? t('sales.price') : t('sales.unitPrice')"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between px-3 pb-3 text-sm">
                <span class="text-fg-muted">{{ t('sales.lineTotal') }}</span>
                <span class="font-bold text-fg tnum">{{ formatMoney(lineTotal(line)) }}</span>
              </div>
            </Card>
          </div>
        </section>

        <!-- RIGHT: checkout — visually separated from the cart above -->
        <section
          v-if="!isEmpty"
          class="mt-6 space-y-4 border-t border-border pt-6 lg:mt-0 lg:border-t-0 lg:pt-0 lg:sticky lg:top-4"
        >
          <AppTextarea v-model="note" :label="t('sales.note')" :rows="2" />

          <!-- Optional customer (hidden on debt sales — the debt block captures it) -->
          <template v-if="!debt.enabled">
            <AppInput
              v-model="customerName"
              :label="t('sales.customerName')"
              :hint="t('app.optional')"
            />
            <AppInput
              v-model="customerPhone"
              :label="t('sales.customerPhone')"
              inputmode="tel"
              placeholder="998 90 123 45 67"
            />
          </template>

          <DebtBlock :state="debt" :total="total" :errors="errors" />

          <!-- Total + submit -->
          <div class="rounded-2xl border border-border bg-surface-2/40 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-fg-muted">{{ t('sales.total') }}</span>
              <span class="text-xl font-extrabold text-fg tnum">{{ formatMoney(total) }}</span>
            </div>
            <AppButton
              block
              size="lg"
              :loading="submitting"
              :disabled="!linesValid"
              @click="submit"
            >
              <template #icon><ShoppingCart class="size-5" /></template>
              {{ t('sales.submit') }}
            </AppButton>
          </div>
        </section>
      </div>
    </PageContainer>

    <PhonePickerSheet v-model="showPhonePicker" :added-ids="addedPhoneIds" @select="onPhone" />
    <AccessoryPickerSheet
      v-model="showAccessoryPicker"
      :added-ids="addedAccessoryIds"
      @select="onAccessory"
    />
  </div>
</template>
