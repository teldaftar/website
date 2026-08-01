<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Expense } from '@/api/types'
import { useCreateExpense, useUpdateExpense } from '@/composables/useExpenses'
import { toUserMessage } from '@/api/errors'
import { toDateInputValue, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ expense?: Expense }>()
const open = defineModel<boolean>({ required: true })

const createExpense = useCreateExpense()
const updateExpense = useUpdateExpense()
const isEdit = () => !!props.expense

const form = reactive<{ amount: number | null; note: string; spentAt: string }>({
  amount: null,
  note: '',
  spentAt: '',
})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  const e = props.expense
  form.amount = e?.amount ?? null
  form.note = e?.note ?? ''
  form.spentAt = e ? toDateInputValue(e.spentAt) : todayISO()
})

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (form.amount == null || form.amount <= 0) errors.amount = t('validation.required')
  if (!form.note.trim()) errors.note = t('validation.required')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = { amount: form.amount as number, note: form.note.trim(), spentAt: form.spentAt }
    if (props.expense) {
      await updateExpense.mutateAsync({ id: props.expense.id, payload })
    } else {
      await createExpense.mutateAsync(payload)
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
  <ModalSheet v-model="open" :title="isEdit() ? t('expenses.edit') : t('expenses.add')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <MoneyInput v-model="form.amount" :label="t('expenses.amount')" :error="errors.amount" />
      <AppTextarea v-model="form.note" :label="t('expenses.note')" :rows="2" :error="errors.note" />
      <AppDateInput v-model="form.spentAt" :label="t('expenses.date')" :max="todayISO()" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
