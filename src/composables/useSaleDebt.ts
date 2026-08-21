import { reactive } from 'vue'
import type { DebtInput } from '@/api/types'
import { normalizePhone, todayISO } from '@/lib/format'
import { t } from '@/i18n'

export interface DebtState {
  enabled: boolean
  amount: number | null
  dueDate: string
  customerName: string
  customerPhone: string
}

export function createDebtState(): DebtState {
  return reactive({
    enabled: false,
    amount: null,
    dueDate: '',
    customerName: '',
    customerPhone: '',
  })
}

/**
 * Validate the debt block against the sale total. Returns a field→message map
 * (empty when valid, or when the block is disabled). Mirrors the backend rules
 * so the user gets instant feedback; the server codes are still the source of truth.
 *
 * `alreadyPaid` is the debt's already-collected installments (`debt.paidTotal`),
 * relevant only when editing an existing sale: the remaining debt can be at most
 * `total − alreadyPaid`. It defaults to 0 for a fresh sale.
 */
export function validateDebt(
  state: DebtState,
  total: number,
  alreadyPaid = 0,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!state.enabled) return errors

  const maxDebt = Math.max(0, total - alreadyPaid)
  if (state.amount == null || state.amount <= 0) {
    errors.amount = t('validation.positive')
  } else if (state.amount > maxDebt) {
    errors.amount = t('errors.DEBT_EXCEEDS_TOTAL')
  }

  if (!state.dueDate) {
    errors.dueDate = t('validation.required')
  } else if (state.dueDate < todayISO()) {
    errors.dueDate = t('errors.DUE_DATE_IN_PAST')
  }

  if (!state.customerName.trim() || normalizePhone(state.customerPhone).length !== 12) {
    errors.customer = t('errors.CUSTOMER_REQUIRED_FOR_DEBT')
  }

  return errors
}

export function buildDebt(state: DebtState): DebtInput | undefined {
  if (!state.enabled) return undefined
  return {
    amount: state.amount as number,
    dueDate: state.dueDate,
    customerName: state.customerName.trim(),
    customerPhone: normalizePhone(state.customerPhone),
  }
}
