<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { AccessoryKind, NewAccessoryInput } from '@/api/types'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * Create a brand-new accessory for a receipt. This does NOT hit the API — it
 * yields a `newAccessory` line; the backend persists it to the catalog when the
 * receipt is saved. Quantity + purchase price are entered later in the table.
 */
const props = withDefaults(defineProps<{ kind?: AccessoryKind }>(), { kind: 'ACCESSORY' })
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ create: [NewAccessoryInput] }>()

const isKeypad = computed(() => props.kind === 'KEYPAD_PHONE')
const sheetTitle = computed(() => (isKeypad.value ? t('keypad.new') : t('receipts.lineNew')))
const sheetHint = computed(() => (isKeypad.value ? t('keypad.newHint') : t('receipts.newHint')))

const form = reactive<{
  name: string
  imageUrl: string | null
  note: string
}>({ name: '', imageUrl: null, note: '' })
const errors = reactive<Record<string, string>>({})

watch(open, (v) => {
  if (!v) return
  form.name = ''
  form.imageUrl = null
  form.note = ''
  Object.keys(errors).forEach((k) => delete errors[k])
})

const submitting = ref(false)

function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) {
    errors.name = t('validation.required')
    return
  }
  emit('create', {
    name: form.name.trim(),
    kind: props.kind,
    imageUrl: form.imageUrl ?? undefined,
    note: form.note.trim() || undefined,
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
