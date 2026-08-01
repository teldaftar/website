<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Accessory } from '@/api/types'
import { useAddStock } from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { formatNumber } from '@/lib/format'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ accessory: Accessory }>()
const open = defineModel<boolean>({ required: true })

const addStock = useAddStock()

const form = reactive<{ quantity: string; purchasePrice: number | null; note: string }>({
  quantity: '',
  purchasePrice: null,
  note: '',
})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  form.quantity = ''
  form.purchasePrice = props.accessory.purchasePrice
  form.note = ''
  Object.keys(errors).forEach((k) => delete errors[k])
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  const q = Number(form.quantity)
  if (!(form.quantity.trim() !== '' && Number.isInteger(q) && q > 0))
    errors.quantity = t('validation.positive')
  if (form.purchasePrice == null || form.purchasePrice <= 0)
    errors.purchasePrice = t('validation.required')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await addStock.mutateAsync({
      id: props.accessory.id,
      payload: {
        quantity: Number(form.quantity),
        purchasePrice: form.purchasePrice as number,
        note: form.note || undefined,
      },
    })
    notify.success(t('accessories.intakeAdded'))
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('accessories.addStock')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <p class="rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg-muted">
        {{ accessory.name }} · {{ t('accessories.quantity') }}:
        <span class="font-semibold text-fg">{{ formatNumber(accessory.quantity) }}</span>
      </p>

      <AppInput
        v-model="form.quantity"
        :label="t('accessories.quantity')"
        inputmode="numeric"
        :error="errors.quantity"
      />
      <MoneyInput
        v-model="form.purchasePrice"
        :label="t('accessories.purchasePrice')"
        :error="errors.purchasePrice"
      />
      <AppTextarea v-model="form.note" :label="t('accessories.note')" :rows="2" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.add') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
