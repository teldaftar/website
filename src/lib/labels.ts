import { t } from '@/i18n'
import type { PhoneCondition, PhoneStatus, SaleStatus, DebtStatus } from '@/api/types'

/** Semantic tones map to the StatusPill / Badge colour variants. */
export type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'

export function phoneStatus(status: PhoneStatus): { label: string; tone: Tone } {
  return status === 'SOLD'
    ? { label: t('phones.statusSold'), tone: 'neutral' }
    : { label: t('phones.statusInStock'), tone: 'success' }
}

export function phoneCondition(condition: PhoneCondition): { label: string; tone: Tone } {
  switch (condition) {
    case 'USED':
      return { label: t('phones.conditionUsed'), tone: 'warning' }
    case 'MEDIUM':
      return { label: t('phones.conditionMedium'), tone: 'warning' }
    default:
      return { label: t('phones.conditionNew'), tone: 'info' }
  }
}

export function saleStatus(status: SaleStatus): { label: string; tone: Tone } {
  switch (status) {
    case 'RETURNED':
      return { label: t('sales.statusReturned'), tone: 'danger' }
    case 'PARTIALLY_RETURNED':
      return { label: t('sales.statusPartiallyReturned'), tone: 'warning' }
    default:
      return { label: t('sales.statusCompleted'), tone: 'success' }
  }
}

export function debtStatus(status: DebtStatus): { label: string; tone: Tone } {
  switch (status) {
    case 'PAID':
      return { label: t('debts.statusPaid'), tone: 'success' }
    case 'CANCELLED':
      return { label: t('debts.statusCancelled'), tone: 'neutral' }
    default:
      return { label: t('debts.statusOpen'), tone: 'warning' }
  }
}
