<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Debt } from '@/api/types'
import { useUpdateDebt } from '@/composables/useDebts'
import { toUserMessage } from '@/api/errors'
import { toDateInputValue, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ debt: Debt }>()
const open = defineModel<boolean>({ required: true })

const updateDebt = useUpdateDebt()
const form = reactive({ dueDate: '', note: '' })
const error = ref('')
const submitting = ref(false)

watch(open, (v) => {
  if (!v) return
  form.dueDate = toDateInputValue(props.debt.dueDate)
  form.note = props.debt.note ?? ''
  error.value = ''
})

async function onSubmit() {
  error.value = ''
  if (!form.dueDate) {
    error.value = t('validation.required')
    return
  }
  submitting.value = true
  try {
    await updateDebt.mutateAsync({
      id: props.debt.id,
      payload: { dueDate: form.dueDate, note: form.note || undefined },
    })
    notify.success(t('debts.extendSuccess'))
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('debts.extend')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppDateInput
        v-model="form.dueDate"
        :label="t('debts.newDueDate')"
        :min="todayISO()"
        :error="error"
      />
      <AppTextarea v-model="form.note" :label="t('debts.note')" :rows="2" />

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
