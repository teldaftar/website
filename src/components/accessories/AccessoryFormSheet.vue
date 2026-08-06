<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Accessory } from '@/api/types'
import { useUpdateAccessory } from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * Edit an accessory's catalog attributes only — name, note, image. Quantity,
 * purchase price and sale price are NOT edited here: they're managed through
 * Kirim (stock receipts), so exposing them here would be misleading.
 */
const props = defineProps<{ accessory: Accessory }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [Accessory] }>()

const updateAccessory = useUpdateAccessory()

const form = reactive<{ name: string; note: string; imageUrl: string | null }>({
  name: '',
  note: '',
  imageUrl: null,
})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  form.name = props.accessory.name
  form.note = props.accessory.note ?? ''
  form.imageUrl = props.accessory.imageUrl ?? null
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = t('validation.required')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    // Omit quantity / purchasePrice / salePrice — PATCH leaves them unchanged.
    const updated = await updateAccessory.mutateAsync({
      id: props.accessory.id,
      payload: { name: form.name.trim(), note: form.note || null, imageUrl: form.imageUrl },
    })
    notify.success(t('settings.saved'))
    emit('saved', updated)
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('accessories.edit')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="form.name" :label="t('accessories.name')" :error="errors.name" />
      <p class="rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg-muted">
        {{ t('accessories.priceLocked') }}
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
