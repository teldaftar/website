<script setup lang="ts">
import { computed } from 'vue'
import { Phone, CalendarClock, Check } from 'lucide-vue-next'
import type { Debt } from '@/api/types'
import { formatMoney, formatDate, formatPhone } from '@/lib/format'
import { debtStatus } from '@/lib/labels'
import { t } from '@/i18n'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ debt: Debt }>()
defineEmits<{ pay: []; extend: []; openSale: [] }>()

const status = computed(() => debtStatus(props.debt.status))
const isOpen = computed(() => props.debt.status === 'OPEN')
</script>

<template>
  <div
    class="rounded-2xl border bg-surface p-4 transition-shadow"
    :class="debt.isOverdue ? 'border-danger/50 ring-1 ring-danger/20' : 'border-border'"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate font-semibold text-fg">{{ debt.customerName }}</p>
        <a
          :href="`tel:${debt.customerPhone}`"
          class="inline-flex items-center gap-1 text-sm text-primary"
          @click.stop
        >
          <Phone class="size-3.5" />
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

    <div class="mt-3 flex items-end justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate text-sm text-fg-muted">{{ debt.productName }}</p>
        <button class="text-xs text-primary hover:underline" @click.stop="$emit('openSale')">
          {{ debt.saleCode }}
        </button>
      </div>
      <div class="text-right">
        <p class="text-xs text-fg-muted">{{ t('debts.owed') }}</p>
        <p class="text-lg font-bold text-fg tnum" :class="debt.isOverdue ? 'text-danger' : ''">
          {{ formatMoney(debt.amount) }}
        </p>
        <p class="text-xs text-fg-muted">
          <CalendarClock class="mr-0.5 inline size-3" />{{ formatDate(debt.dueDate) }}
        </p>
      </div>
    </div>

    <div v-if="isOpen" class="mt-4 flex gap-2">
      <AppButton size="sm" block @click.stop="$emit('pay')">
        <template #icon><Check class="size-4" /></template>
        {{ t('debts.pay') }}
      </AppButton>
      <AppButton size="sm" variant="secondary" block @click.stop="$emit('extend')">
        {{ t('debts.extend') }}
      </AppButton>
    </div>
  </div>
</template>
