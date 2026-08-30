<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Creditor } from '@/api/types'
import { useCreateCreditor, useUpdateCreditor } from '@/composables/useCreditors'
import { toUserMessage } from '@/api/errors'
import { toDateInputValue, todayISO, normalizePhone } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ creditor?: Creditor }>()
const open = defineModel<boolean>({ required: true })

const createCreditor = useCreateCreditor()
const updateCreditor = useUpdateCreditor()
const isEdit = () => !!props.creditor

const form = reactive<{
  amount: number | null
  creditorName: string
  phone: string
  note: string
  borrowedAt: string
  dueDate: string
}>({ amount: null, creditorName: '', phone: '', note: '', borrowedAt: '', dueDate: '' })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  const c = props.creditor
  form.amount = c?.amount ?? null
  form.creditorName = c?.creditorName ?? ''
  form.phone = c?.phone ?? ''
  form.note = c?.note ?? ''
  form.borrowedAt = c ? toDateInputValue(c.borrowedAt) : todayISO()
  form.dueDate = c ? toDateInputValue(c.dueDate) : ''
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (form.amount == null || form.amount <= 0) errors.amount = t('validation.positive')
  if (!form.creditorName.trim()) errors.creditorName = t('validation.required')
  if (!form.dueDate) errors.dueDate = t('validation.required')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      amount: form.amount as number,
      creditorName: form.creditorName.trim(),
      dueDate: form.dueDate,
      borrowedAt: form.borrowedAt || undefined,
      phone: normalizePhone(form.phone) || null,
      note: form.note.trim() || null,
    }
    if (props.creditor) {
      await updateCreditor.mutateAsync({ id: props.creditor.id, payload })
    } else {
      await createCreditor.mutateAsync(payload)
    }
    notify.success(t('settings.saved'))
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="isEdit() ? t('creditors.edit') : t('creditors.add')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <MoneyInput v-model="form.amount" :label="t('creditors.amount')" :error="errors.amount" />
      <AppInput
        v-model="form.creditorName"
        :label="t('creditors.creditorName')"
        :error="errors.creditorName"
      />

      <div class="grid grid-cols-2 gap-3">
        <AppDateInput
          v-model="form.borrowedAt"
          :label="t('creditors.borrowedAt')"
          :max="todayISO()"
        />
        <AppDateInput
          v-model="form.dueDate"
          :label="t('creditors.dueDate')"
          :error="errors.dueDate"
        />
      </div>

      <AppInput
        v-model="form.phone"
        :label="t('creditors.phone')"
        :hint="t('app.optional')"
        inputmode="tel"
        placeholder="998 90 123 45 67"
      />
      <AppTextarea v-model="form.note" :label="t('creditors.note')" :rows="2" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
