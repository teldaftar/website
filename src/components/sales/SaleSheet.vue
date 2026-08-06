<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Check, RotateCcw, Receipt, Smartphone, Headphones } from 'lucide-vue-next'
import type { Accessory, Phone, Sale } from '@/api/types'
import { useCreatePhoneSale, useCreateAccessorySale } from '@/composables/useSales'
import { createDebtState, validateDebt, buildDebt } from '@/composables/useSaleDebt'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { formatMoney, formatCost, formatMemory, normalizePhone } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'
import DebtBlock from '@/components/sales/DebtBlock.vue'

/** Exactly one of `phone` / `accessory` is provided (the pre-selected product). */
const props = defineProps<{ phone?: Phone; accessory?: Accessory }>()
const open = defineModel<boolean>({ required: true })

const router = useRouter()
const createPhoneSale = useCreatePhoneSale()
const createAccessorySale = useCreateAccessorySale()

const isPhone = computed(() => !!props.phone)
const productName = computed(() => props.phone?.name ?? props.accessory?.name ?? '')
const purchasePrice = computed(
  () => props.phone?.purchasePrice ?? props.accessory?.purchasePrice ?? 0,
)
const subtitle = computed(() => {
  if (props.phone) return formatMemory(props.phone.ramGb, props.phone.storageGb) || props.phone.imei
  return `${props.accessory?.quantity ?? 0} ${t('accessories.unit')} mavjud`
})

const price = ref<number | null>(null)
const quantity = ref(1)
const unitPrice = ref<number | null>(null)
const note = ref('')
// Optional customer info recorded for any sale. On a debt sale the debt block
// captures the customer instead (backend auto-fills these from it).
const customerName = ref('')
const customerPhone = ref('')
const debt = createDebtState()
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const done = ref<Sale | null>(null)

const total = computed(() =>
  isPhone.value ? (price.value ?? 0) : (unitPrice.value ?? 0) * quantity.value,
)

// (Re)initialise every time the sheet opens. `immediate` covers the first mount,
// since the parent gates this component with v-if and opens it in the same tick.
watch(
  open,
  (v) => {
    if (!v) return
    reset()
    if (props.phone) price.value = props.phone.listPrice ?? null
    if (props.accessory) {
      quantity.value = Math.min(1, props.accessory.quantity) || 1
      unitPrice.value = props.accessory.salePrice ?? null
    }
  },
  { immediate: true },
)

function reset() {
  done.value = null
  price.value = null
  quantity.value = 1
  unitPrice.value = null
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

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (isPhone.value) {
    if (price.value == null || price.value <= 0) errors.price = t('validation.required')
  } else if (props.accessory) {
    if (unitPrice.value == null || unitPrice.value <= 0) errors.unitPrice = t('validation.required')
    if (quantity.value < 1 || quantity.value > props.accessory.quantity)
      errors.quantity = t('errors.INSUFFICIENT_STOCK')
  }
  Object.assign(errors, validateDebt(debt, total.value))
  return Object.keys(errors).length === 0
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  // Customer is only entered directly on non-debt sales; on debt sales the debt
  // block owns it and the backend fills these from the debt customer.
  const customer = debt.enabled
    ? {}
    : {
        customerName: customerName.value.trim() || undefined,
        customerPhone: normalizePhone(customerPhone.value) || undefined,
      }
  try {
    let sale: Sale
    if (props.phone) {
      sale = await createPhoneSale.mutateAsync({
        phoneId: props.phone.id,
        price: price.value as number,
        note: note.value || undefined,
        debt: buildDebt(debt),
        ...customer,
      })
    } else if (props.accessory) {
      sale = await createAccessorySale.mutateAsync({
        accessoryId: props.accessory.id,
        quantity: quantity.value,
        unitPrice: unitPrice.value ?? undefined,
        note: note.value || undefined,
        debt: buildDebt(debt),
        ...customer,
      })
    } else {
      return
    }
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
  switch (e.code) {
    case 'DEBT_EXCEEDS_TOTAL':
      errors.amount = msg
      break
    case 'DUE_DATE_IN_PAST':
      errors.dueDate = msg
      break
    case 'CUSTOMER_REQUIRED_FOR_DEBT':
      errors.customer = msg
      break
    case 'INSUFFICIENT_STOCK':
      errors.quantity = msg
      break
    case 'PRICE_REQUIRED':
      errors.unitPrice = msg
      break
  }
  notify.error(msg)
}

function openReceipt() {
  const id = done.value?.id
  open.value = false
  if (id) router.push({ name: 'sale-detail', params: { id } })
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('sales.title')">
    <!-- Success -->
    <div v-if="done" class="flex flex-col items-center py-4 text-center">
      <div
        v-motion-pop
        class="grid size-16 place-items-center rounded-full bg-success-soft text-success"
      >
        <Check class="size-9" :stroke-width="3" />
      </div>
      <h3 class="mt-4 text-lg font-bold text-fg">{{ t('sales.successTitle') }}</h3>
      <p class="mt-1 text-2xl font-extrabold tracking-wide text-primary tnum">{{ done.code }}</p>
      <p class="text-fg tnum">{{ formatMoney(done.totalAmount) }}</p>
      <div class="mt-6 flex w-full gap-3">
        <AppButton variant="secondary" block @click="open = false">
          <template #icon><RotateCcw class="size-4" /></template>
          {{ t('app.close') }}
        </AppButton>
        <AppButton block @click="openReceipt">
          <template #icon><Receipt class="size-4" /></template>
          {{ t('sales.receipt') }}
        </AppButton>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="space-y-4" novalidate @submit.prevent="submit">
      <!-- Product + purchase price -->
      <div class="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
        <div class="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-fg-muted">
          <component :is="isPhone ? Smartphone : Headphones" class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-fg">{{ productName }}</p>
          <p class="truncate text-xs text-fg-muted">{{ subtitle }}</p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-[11px] text-fg-muted">{{ t('phones.purchasePrice') }}</p>
          <p class="text-sm font-bold text-fg tnum">{{ formatCost(purchasePrice) }}</p>
        </div>
      </div>

      <!-- Phone: price -->
      <MoneyInput
        v-if="isPhone"
        v-model="price"
        :label="t('sales.price')"
        :error="errors.price"
        :hint="
          phone?.listPrice ? `${t('phones.listPrice')}: ${formatMoney(phone.listPrice)}` : undefined
        "
      />

      <!-- Accessory: quantity + unit price -->
      <template v-else-if="accessory">
        <QuantityStepper
          v-model="quantity"
          :label="t('sales.quantity')"
          :min="1"
          :max="accessory.quantity"
        >
          <template #hint>{{ accessory.quantity }} {{ t('accessories.unit') }} mavjud</template>
        </QuantityStepper>
        <MoneyInput v-model="unitPrice" :label="t('sales.unitPrice')" :error="errors.unitPrice" />
        <p v-if="unitPrice" class="text-right text-sm text-fg-muted">
          {{ t('sales.total') }}: <span class="font-bold text-fg">{{ formatMoney(total) }}</span>
        </p>
      </template>

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

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('sales.submit') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
