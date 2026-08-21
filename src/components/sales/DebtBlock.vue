<script setup lang="ts">
import { computed } from 'vue'
import type { DebtState } from '@/composables/useSaleDebt'
import { formatMoney, todayISO } from '@/lib/format'
import { t } from '@/i18n'
import Toggle from '@/components/ui/Toggle.vue'
import AppInput from '@/components/ui/AppInput.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppDateInput from '@/components/ui/AppDateInput.vue'

const props = defineProps<{
  state: DebtState
  total: number
  errors: Record<string, string>
  /** Installments already collected on this debt (`debt.paidTotal`); edit mode only. */
  alreadyPaid?: number
}>()

const alreadyPaid = computed(() => props.alreadyPaid ?? 0)
// paid (non-debt part, collected as cash) = total − remaining debt, shown live.
const paid = computed(() => Math.max(0, props.total - (props.state.amount ?? 0)))
// Editing a debt that already has installments: show jami / to'langan / qoldiq.
const hasInstallments = computed(() => alreadyPaid.value > 0)
// Full debt = already-paid installments + the remaining the owner is setting.
const totalDebt = computed(() => alreadyPaid.value + (props.state.amount ?? 0))
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -- `state` is a shared reactive form
       object the parent owns and passes in for this block to fill; mutating its
       fields via v-model is intentional (single source of truth for the sale). -->
  <div class="rounded-2xl border border-border bg-surface-2/40 p-4">
    <label class="flex items-center justify-between gap-3">
      <span class="font-medium text-fg">{{ t('sales.debtToggle') }}</span>
      <Toggle v-model="state.enabled" />
    </label>

    <Transition name="dialog">
      <div v-if="state.enabled" class="mt-4 space-y-3">
        <MoneyInput
          v-model="state.amount"
          :label="hasInstallments ? t('debts.remaining') : t('sales.debtAmount')"
          :error="errors.amount"
        />

        <!-- Edit mode with installments already paid: jami qarz / to'langan / qoldiq -->
        <div v-if="hasInstallments" class="grid grid-cols-3 gap-3 text-sm">
          <div class="rounded-xl bg-surface p-3">
            <p class="text-fg-muted">{{ t('debts.totalDebt') }}</p>
            <p class="mt-0.5 font-bold text-fg tnum">{{ formatMoney(totalDebt) }}</p>
          </div>
          <div class="rounded-xl bg-surface p-3">
            <p class="text-fg-muted">{{ t('debts.paid') }}</p>
            <p class="mt-0.5 font-bold text-success tnum">{{ formatMoney(alreadyPaid) }}</p>
          </div>
          <div class="rounded-xl bg-surface p-3">
            <p class="text-fg-muted">{{ t('debts.remaining') }}</p>
            <p class="mt-0.5 font-bold text-warning tnum">{{ formatMoney(state.amount ?? 0) }}</p>
          </div>
        </div>

        <!-- Fresh sale (or no installments): live paid / remaining split -->
        <div v-else class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-surface p-3">
            <p class="text-fg-muted">{{ t('sales.paid') }}</p>
            <p class="mt-0.5 font-bold text-success tnum">{{ formatMoney(paid) }}</p>
          </div>
          <div class="rounded-xl bg-surface p-3">
            <p class="text-fg-muted">{{ t('sales.remaining') }}</p>
            <p class="mt-0.5 font-bold text-warning tnum">{{ formatMoney(state.amount ?? 0) }}</p>
          </div>
        </div>

        <AppDateInput
          v-model="state.dueDate"
          :label="t('sales.dueDate')"
          :min="todayISO()"
          :error="errors.dueDate"
        />
        <AppInput
          v-model="state.customerName"
          :label="t('sales.customerName')"
          :error="errors.customer"
        />
        <AppInput
          v-model="state.customerPhone"
          :label="t('sales.customerPhone')"
          inputmode="tel"
          placeholder="998 90 123 45 67"
        />
      </div>
    </Transition>
  </div>
</template>
