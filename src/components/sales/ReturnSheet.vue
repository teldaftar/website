<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Sale, SaleItem } from '@/api/types'
import { useCreateReturn } from '@/composables/useSales'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { formatMoney } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ sale: Sale }>()
const open = defineModel<boolean>({ required: true })

const createReturn = useCreateReturn()

// Only items that still have returnable quantity.
const returnable = computed(() =>
  props.sale.items.filter((i) => i.quantity - i.returnedQuantity > 0),
)
const itemOptions = computed(() =>
  returnable.value.map((i) => ({
    label: `${i.product.name} (${i.quantity - i.returnedQuantity})`,
    value: i.id,
  })),
)

const form = reactive<{
  saleItemId: string | undefined
  quantity: number
  amount: number | null
  reason: string
}>({
  saleItemId: undefined,
  quantity: 1,
  amount: null,
  reason: '',
})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

const selected = computed<SaleItem | undefined>(() =>
  props.sale.items.find((i) => i.id === form.saleItemId),
)
const maxQty = computed(() =>
  selected.value ? selected.value.quantity - selected.value.returnedQuantity : 1,
)
const maxAmount = computed(() => (selected.value ? selected.value.unitPrice * form.quantity : 0))

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  form.saleItemId = returnable.value[0]?.id
  form.quantity = 1
  form.amount = null
  form.reason = ''
})

watch(
  () => form.saleItemId,
  () => {
    form.quantity = 1
  },
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.saleItemId) errors.saleItemId = t('validation.required')
  if (form.quantity < 1 || form.quantity > maxQty.value)
    errors.quantity = t('errors.RETURN_EXCEEDS_SOLD')
  if (form.amount != null && form.amount > maxAmount.value)
    errors.amount = t('errors.RETURN_AMOUNT_EXCEEDS_SOLD')
  if (!form.reason.trim()) errors.reason = t('validation.required')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate() || !form.saleItemId) return
  submitting.value = true
  try {
    await createReturn.mutateAsync({
      id: props.sale.id,
      payload: {
        saleItemId: form.saleItemId,
        quantity: form.quantity,
        amount: form.amount ?? undefined,
        reason: form.reason.trim(),
      },
    })
    notify.success(t('returns.success'))
    open.value = false
  } catch (err) {
    const e = normalizeError(err)
    const msg = mapErrorCode(e.code, e.details)
    if (e.code === 'RETURN_EXCEEDS_SOLD') errors.quantity = msg
    else if (e.code === 'RETURN_AMOUNT_EXCEEDS_SOLD') errors.amount = msg
    notify.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('returns.title')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppSelect
        v-if="itemOptions.length > 1"
        v-model="form.saleItemId"
        :label="t('returns.pickItem')"
        :options="itemOptions"
        :error="errors.saleItemId"
      />

      <QuantityStepper
        v-model="form.quantity"
        :label="t('returns.quantity')"
        :min="1"
        :max="maxQty"
      >
        <template #hint>{{ maxQty }} {{ t('accessories.unit') }}</template>
      </QuantityStepper>

      <MoneyInput
        v-model="form.amount"
        :label="t('returns.amount')"
        :error="errors.amount"
        :hint="`${t('app.optional')} · max ${formatMoney(maxAmount)}`"
      />

      <AppTextarea
        v-model="form.reason"
        :label="t('returns.reason')"
        :rows="2"
        :error="errors.reason"
      />

      <!-- Plain-language effects -->
      <div class="space-y-1 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-fg-muted">
        <p>
          • {{ sale.type === 'PHONE' ? t('returns.effectPhone') : t('returns.effectAccessory') }}
        </p>
        <p v-if="sale.debt">• {{ t('returns.effectDebt') }}</p>
      </div>

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" variant="danger" block :loading="submitting">
          {{ t('returns.submit') }}
        </AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
