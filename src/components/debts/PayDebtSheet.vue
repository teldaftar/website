<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Debt } from '@/api/types'
import { usePayDebt } from '@/composables/useDebts'
import { toUserMessage } from '@/api/errors'
import { formatMoney, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ debt: Debt }>()
const open = defineModel<boolean>({ required: true })

const payDebt = usePayDebt()
const paidAt = ref(todayISO())
const submitting = ref(false)

watch(open, (v) => {
  if (v) paidAt.value = todayISO()
})

async function onConfirm() {
  submitting.value = true
  try {
    await payDebt.mutateAsync({ id: props.debt.id, payload: { paidAt: paidAt.value } })
    notify.success(t('debts.paidSuccess'))
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('debts.pay')">
    <div class="space-y-4">
      <div class="rounded-xl bg-surface-2 p-4 text-center">
        <p class="text-sm text-fg-muted">{{ debt.customerName }}</p>
        <p class="mt-1 text-2xl font-extrabold text-fg tnum">{{ formatMoney(debt.amount) }}</p>
      </div>
      <p class="text-sm text-fg-muted">{{ t('debts.payConfirm') }}</p>
      <AppDateInput v-model="paidAt" :label="t('debts.settlementDate')" :max="todayISO()" />

      <div class="flex gap-3 pt-1">
        <AppButton variant="secondary" block @click="open = false">{{ t('app.cancel') }}</AppButton>
        <AppButton block :loading="submitting" @click="onConfirm">{{ t('debts.pay') }}</AppButton>
      </div>
    </div>
  </ModalSheet>
</template>
