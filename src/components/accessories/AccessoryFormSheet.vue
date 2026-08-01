<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Accessory, CreateAccessoryPayload } from '@/api/types'
import { useCreateAccessory, useUpdateAccessory } from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ accessory?: Accessory }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [Accessory] }>()

const createAccessory = useCreateAccessory()
const updateAccessory = useUpdateAccessory()

const isEdit = () => !!props.accessory

interface FormState {
  name: string
  purchasePrice: number | null
  salePrice: number | null
  quantity: string
  note: string
  imageUrl: string | null
}

const form = reactive<FormState>(blank())
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

function blank(): FormState {
  return { name: '', purchasePrice: null, salePrice: null, quantity: '', note: '', imageUrl: null }
}

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  const a = props.accessory
  if (a) {
    form.name = a.name
    form.purchasePrice = a.purchasePrice
    form.salePrice = a.salePrice ?? null
    form.quantity = String(a.quantity)
    form.note = a.note ?? ''
    form.imageUrl = a.imageUrl ?? null
  } else {
    Object.assign(form, blank())
  }
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = t('validation.required')
  if (form.purchasePrice == null || form.purchasePrice <= 0)
    errors.purchasePrice = t('validation.required')
  if (!isEdit()) {
    const q = Number(form.quantity)
    if (!(form.quantity.trim() !== '' && Number.isInteger(q) && q > 0))
      errors.quantity = t('validation.positive')
  }
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (props.accessory) {
      const updated = await updateAccessory.mutateAsync({
        id: props.accessory.id,
        payload: {
          name: form.name.trim(),
          purchasePrice: form.purchasePrice as number,
          salePrice: form.salePrice,
          note: form.note || null,
          imageUrl: form.imageUrl,
        },
      })
      finish(updated, t('settings.saved'))
    } else {
      const payload: CreateAccessoryPayload = {
        name: form.name.trim(),
        purchasePrice: form.purchasePrice as number,
        quantity: Number(form.quantity),
        salePrice: form.salePrice,
        note: form.note || null,
        imageUrl: form.imageUrl,
      }
      const created = await createAccessory.mutateAsync(payload)
      finish(created, t('accessories.add'))
    }
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}

function finish(accessory: Accessory, message: string) {
  notify.success(message)
  emit('saved', accessory)
  open.value = false
}
</script>

<template>
  <ModalSheet v-model="open" :title="isEdit() ? t('accessories.edit') : t('accessories.add')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="form.name" :label="t('accessories.name')" :error="errors.name" />
      <MoneyInput
        v-model="form.purchasePrice"
        :label="t('accessories.purchasePrice')"
        :error="errors.purchasePrice"
      />
      <MoneyInput v-model="form.salePrice" :label="t('accessories.salePrice')" />

      <AppInput
        v-if="!isEdit()"
        v-model="form.quantity"
        :label="t('accessories.quantity')"
        inputmode="numeric"
        :error="errors.quantity"
      />
      <p v-else class="rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg-muted">
        {{ t('accessories.quantityLocked') }}
      </p>

      <AppTextarea v-model="form.note" :label="t('accessories.note')" :rows="2" />
      <ImageUploader v-model="form.imageUrl" :label="t('accessories.image')" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
