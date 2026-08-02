<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePayDebt, useDebtPayments } from '@/composables/useDebts'
import { toUserMessage } from '@/api/errors'
import { formatMoney, formatDate, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

/** Minimal shape the sheet needs — satisfied by both `Debt` and `EmbeddedDebt`. */
interface PayableDebt {
  id: string
  customerName: string
  amount: number
  paidTotal: number
}

const props = defineProps<{ debt: PayableDebt }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ paid: [] }>()

const payDebt = usePayDebt()
const { data: payments, isLoading: paymentsLoading } = useDebtPayments(
  () => props.debt.id,
  open,
)

const amount = ref<number | null>(null)
const paidAt = ref(todayISO())
const note = ref('')
const submitting = ref(false)

/** Original debt = still owed + already paid against it. */
const totalDebt = computed(() => props.debt.amount + props.debt.paidTotal)
const remaining = computed(() => props.debt.amount)

const amountError = computed(() => {
  if (amount.value == null || amount.value <= 0) return undefined // only after submit attempt
  if (amount.value > remaining.value) return t('debts.amountExceedsRemaining')
  return undefined
})

watch(open, (v) => {
  if (v) {
    amount.value = props.debt.amount
    paidAt.value = todayISO()
    note.value = ''
  }
})

async function onConfirm() {
  if (amount.value == null || amount.value <= 0) {
    notify.error(t('debts.amountRequired'))
    return
  }
  if (amount.value > remaining.value) {
    notify.error(t('debts.amountExceedsRemaining'))
    return
  }
  submitting.value = true
  try {
    await payDebt.mutateAsync({
      id: props.debt.id,
      payload: {
        amount: amount.value,
        paidAt: paidAt.value,
        note: note.value.trim() || undefined,
      },
    })
    notify.success(t('debts.paidSuccess'))
    emit('paid')
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
      <div class="rounded-xl bg-surface-2 p-4">
        <p class="text-center text-sm text-fg-muted">{{ debt.customerName }}</p>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-xs text-fg-muted">{{ t('debts.totalDebt') }}</p>
            <p class="mt-0.5 text-sm font-semibold text-fg tnum">{{ formatMoney(totalDebt) }}</p>
          </div>
          <div>
            <p class="text-xs text-fg-muted">{{ t('debts.paid') }}</p>
            <p class="mt-0.5 text-sm font-semibold text-success tnum">
              {{ formatMoney(debt.paidTotal) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-fg-muted">{{ t('debts.remaining') }}</p>
            <p class="mt-0.5 text-sm font-extrabold text-fg tnum">{{ formatMoney(remaining) }}</p>
          </div>
        </div>
      </div>

      <div>
        <MoneyInput
          v-model="amount"
          :label="t('debts.paymentAmount')"
          :error="amountError"
        />
        <button
          type="button"
          class="mt-1.5 text-xs font-medium text-primary hover:underline"
          @click="amount = remaining"
        >
          {{ t('debts.payFull') }} ({{ formatMoney(remaining) }})
        </button>
      </div>

      <AppDateInput v-model="paidAt" :label="t('debts.settlementDate')" :max="todayISO()" />
      <AppInput v-model="note" :label="t('debts.note')" />

      <div class="flex gap-3 pt-1">
        <AppButton variant="secondary" block @click="open = false">{{ t('app.cancel') }}</AppButton>
        <AppButton block :loading="submitting" @click="onConfirm">{{ t('debts.pay') }}</AppButton>
      </div>

      <div class="border-t border-border pt-4">
        <p class="mb-2 text-sm font-semibold text-fg">{{ t('debts.payHistory') }}</p>
        <p v-if="paymentsLoading" class="text-sm text-fg-muted">…</p>
        <p v-else-if="!payments || payments.length === 0" class="text-sm text-fg-muted">
          {{ t('debts.noPayments') }}
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="p in payments"
            :key="p.id"
            class="flex items-start justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="text-sm text-fg-muted">{{ formatDate(p.paidAt) }}</p>
              <p v-if="p.note" class="truncate text-xs text-fg-muted">{{ p.note }}</p>
            </div>
            <p class="shrink-0 text-sm font-semibold text-success tnum">
              {{ formatMoney(p.amount) }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </ModalSheet>
</template>
