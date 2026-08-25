<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { AccessoryKind } from '@/api/types'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { NewReceiptDraft } from './receiptLine'

/**
 * Create a brand-new accessory / keypad phone for a receipt, captured in FULL —
 * name, quantity, purchase price and (optional) sale price all in one place, so
 * the item lands in the table already complete with no follow-up row editing.
 * This does NOT hit the API — the backend persists it when the receipt is saved.
 */
const props = withDefaults(defineProps<{ kind?: AccessoryKind }>(), { kind: 'ACCESSORY' })
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ create: [NewReceiptDraft] }>()

const isKeypad = computed(() => props.kind === 'KEYPAD_PHONE')
const sheetTitle = computed(() => (isKeypad.value ? t('keypad.new') : t('receipts.lineNew')))
const sheetHint = computed(() => (isKeypad.value ? t('keypad.newHint') : t('receipts.newHint')))

const form = reactive<{
  name: string
  imei: string
  quantity: string
  purchasePrice: number | null
  salePrice: number | null
  imageUrl: string | null
  note: string
}>({
  name: '',
  imei: '',
  quantity: '1',
  purchasePrice: null,
  salePrice: null,
  imageUrl: null,
  note: '',
})
const errors = reactive<Record<string, string>>({})

watch(open, (v) => {
  if (!v) return
  form.name = ''
  form.imei = ''
  form.quantity = '1'
  form.purchasePrice = null
  form.salePrice = null
  form.imageUrl = null
  form.note = ''
  Object.keys(errors).forEach((k) => delete errors[k])
})

const submitting = ref(false)

/** Parsed positive-integer quantity, or 0 when blank/invalid. */
function parsedQty(): number {
  const q = Number(form.quantity)
  return form.quantity.trim() !== '' && Number.isInteger(q) && q > 0 ? q : 0
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = t('validation.required')
  if (parsedQty() < 1) errors.quantity = t('validation.positive')
  // Purchase price is required but may be 0 (tekin/free intake).
  if (form.purchasePrice == null || form.purchasePrice < 0)
    errors.purchasePrice = t('validation.required')
  return Object.keys(errors).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('create', {
    input: {
      name: form.name.trim(),
      kind: props.kind,
      // IMEI applies to keypad phones only.
      imei: isKeypad.value ? form.imei.trim() || undefined : undefined,
      salePrice: form.salePrice != null && form.salePrice >= 0 ? form.salePrice : undefined,
      imageUrl: form.imageUrl ?? undefined,
      note: form.note.trim() || undefined,
    },
    quantity: parsedQty(),
    purchasePrice: form.purchasePrice as number,
  })
  open.value = false
}
</script>

<template>
  <ModalSheet v-model="open" :title="sheetTitle">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <p class="rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg-muted">
        {{ sheetHint }}
      </p>

      <AppInput v-model="form.name" :label="t('receipts.newName')" :error="errors.name" />

      <AppInput
        v-if="isKeypad"
        v-model="form.imei"
        :label="t('phones.imei')"
        :hint="t('app.optional')"
      />

      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="form.quantity"
          :label="t('receipts.quantity')"
          inputmode="numeric"
          :error="errors.quantity"
        />
        <MoneyInput
          v-model="form.purchasePrice"
          :label="t('receipts.purchasePrice')"
          :hint="t('receipts.freeHint')"
          :error="errors.purchasePrice"
        />
      </div>

      <MoneyInput
        v-model="form.salePrice"
        :label="t('receipts.salePrice')"
        :hint="t('app.optional')"
      />

      <ImageUploader v-model="form.imageUrl" :label="t('receipts.newImage')" />
      <AppTextarea v-model="form.note" :label="t('receipts.newNote')" :rows="2" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.add') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
