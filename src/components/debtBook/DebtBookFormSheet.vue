<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { CreateDebtBookPayload, DebtBookEntry, UpdateDebtBookPayload } from '@/api/types'
import {
  debtBookErrorMessage,
  useCreateDebtBookEntry,
  useUpdateDebtBookEntry,
} from '@/composables/useDebtBook'
import { maskUzPhone, normalizePhone, formatPhone } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ entry?: DebtBookEntry }>()
const open = defineModel<boolean>({ required: true })

const createEntry = useCreateDebtBookEntry()
const updateEntry = useUpdateDebtBookEntry()
const isEdit = () => !!props.entry

const form = reactive<{
  borrowerName: string
  amount: number | null
  phone: string
  dueDate: string
  note: string
}>({ borrowerName: '', amount: null, phone: '', dueDate: '', note: '' })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  const e = props.entry
  form.borrowerName = e?.borrowerName ?? ''
  form.amount = e?.amount ?? null
  form.phone = e?.phone ? maskUzPhone(formatPhone(e.phone)) : ''
  form.dueDate = e?.dueDate ?? ''
  form.note = e?.note ?? ''
})

// Re-mask on every keystroke so the field always reads "+998 90 123 45 67".
watch(
  () => form.phone,
  (v) => {
    const masked = maskUzPhone(v)
    if (masked !== v) form.phone = masked
  },
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.borrowerName.trim()) errors.borrowerName = t('validation.required')
  if (form.amount == null || form.amount <= 0) errors.amount = t('validation.positive')
  const phone = normalizePhone(form.phone)
  if (phone && phone.length !== 12) errors.phone = t('debtBook.phoneIncomplete')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const borrowerName = form.borrowerName.trim()
    const amount = form.amount as number
    const phone = normalizePhone(form.phone)
    const note = form.note.trim()

    if (props.entry) {
      // Edit: a cleared optional field is sent as null so the backend clears it.
      const payload: UpdateDebtBookPayload = {
        borrowerName,
        amount,
        phone: phone || null,
        dueDate: form.dueDate || null,
        note: note || null,
      }
      await updateEntry.mutateAsync({ id: props.entry.id, payload })
      notify.success(t('debtBook.updated'))
    } else {
      // Create: omit empty optionals entirely (backend rejects unknown fields,
      // and only the documented ones are ever sent).
      const payload: CreateDebtBookPayload = { borrowerName, amount }
      if (phone) payload.phone = phone
      if (form.dueDate) payload.dueDate = form.dueDate
      if (note) payload.note = note
      await createEntry.mutateAsync(payload)
      notify.success(t('debtBook.created'))
    }
    open.value = false
  } catch (err) {
    notify.error(debtBookErrorMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="isEdit() ? t('debtBook.edit') : t('debtBook.add')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="form.borrowerName"
        :label="t('debtBook.borrowerName')"
        required
        :error="errors.borrowerName"
        autocomplete="off"
      />
      <MoneyInput
        v-model="form.amount"
        :label="t('debtBook.amount')"
        required
        :error="errors.amount"
      />

      <AppInput
        v-model="form.phone"
        :label="t('debtBook.phone')"
        :hint="t('app.optional')"
        :error="errors.phone"
        type="tel"
        inputmode="tel"
        placeholder="+998 90 123 45 67"
        autocomplete="off"
      />

      <div>
        <AppDateInput v-model="form.dueDate" :label="t('debtBook.dueDate')" />
        <button
          v-if="form.dueDate"
          type="button"
          class="mt-1 text-sm font-medium text-primary"
          @click="form.dueDate = ''"
        >
          {{ t('debtBook.clearDate') }}
        </button>
      </div>

      <AppTextarea v-model="form.note" :label="t('debtBook.note')" :rows="3" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
