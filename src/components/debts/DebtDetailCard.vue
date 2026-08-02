<script setup lang="ts">
import { computed } from 'vue'
import { User, CalendarClock, Check } from 'lucide-vue-next'
import type { EmbeddedDebt } from '@/api/types'
import { formatMoney, formatDate, formatPhone } from '@/lib/format'
import { debtStatus } from '@/lib/labels'
import { t } from '@/i18n'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ debt: EmbeddedDebt }>()
defineEmits<{ pay: [] }>()

const status = computed(() => debtStatus(props.debt.status))
const isOpen = computed(() => props.debt.status === 'OPEN')
const payments = computed(() => props.debt.payments ?? [])
</script>

<template>
  <Card>
    <div class="flex items-center gap-3">
      <div class="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-muted">
        <User class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-medium text-fg">{{ debt.customerName }}</p>
        <a :href="`tel:${debt.customerPhone}`" class="text-sm text-primary">
          {{ formatPhone(debt.customerPhone) }}
        </a>
      </div>
      <div class="flex flex-col items-end gap-1">
        <Badge :tone="status.tone">{{ status.label }}</Badge>
        <Badge v-if="debt.isOverdue" tone="danger" dot>
          {{ t('debts.daysOverdue', { n: debt.daysOverdue }) }}
        </Badge>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-xl bg-surface-2 p-3">
        <p class="text-xs text-fg-muted">{{ t('debts.totalDebt') }}</p>
        <p class="mt-0.5 text-sm font-semibold text-fg tnum">{{ formatMoney(debt.originalAmount) }}</p>
      </div>
      <div class="rounded-xl bg-surface-2 p-3">
        <p class="text-xs text-fg-muted">{{ t('debts.paid') }}</p>
        <p class="mt-0.5 text-sm font-semibold text-success tnum">{{ formatMoney(debt.paidTotal) }}</p>
      </div>
      <div class="rounded-xl bg-surface-2 p-3">
        <p class="text-xs text-fg-muted">{{ t('debts.remaining') }}</p>
        <p class="mt-0.5 text-sm font-extrabold text-warning tnum">{{ formatMoney(debt.amount) }}</p>
      </div>
    </div>

    <p class="mt-3 flex items-center gap-1 text-xs text-fg-muted">
      <CalendarClock class="size-3.5" />{{ t('debts.dueDate') }}: {{ formatDate(debt.dueDate) }}
    </p>

    <div v-if="payments.length" class="mt-4 border-t border-border pt-4">
      <p class="mb-2 text-sm font-semibold text-fg">{{ t('debts.payHistory') }}</p>
      <ul class="space-y-2">
        <li
          v-for="(p, i) in payments"
          :key="i"
          class="flex items-start justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2"
        >
          <div class="min-w-0">
            <p class="text-sm text-fg-muted">{{ formatDate(p.paidAt) }}</p>
            <p v-if="p.note" class="truncate text-xs text-fg-muted">{{ p.note }}</p>
          </div>
          <p class="shrink-0 text-sm font-semibold text-success tnum">{{ formatMoney(p.amount) }}</p>
        </li>
      </ul>
    </div>

    <AppButton v-if="isOpen" class="mt-4" size="lg" block @click="$emit('pay')">
      <template #icon><Check class="size-5" /></template>
      {{ t('debts.pay') }}
    </AppButton>
  </Card>
</template>
