<script setup lang="ts">
import { Headphones, X } from 'lucide-vue-next'
import { formatMoney, resolveImageUrl } from '@/lib/format'
import { t } from '@/i18n'
import AppInput from '@/components/ui/AppInput.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import Badge from '@/components/ui/Badge.vue'
import { rowSubtotal, type ReceiptRowState } from './receiptLine'

const row = defineModel<ReceiptRowState>({ required: true })
defineEmits<{ remove: [] }>()
</script>

<template>
  <div class="rounded-2xl border border-border bg-surface p-3">
    <div class="flex items-start gap-3">
      <div class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
        <img
          v-if="resolveImageUrl(row.imageUrl)"
          :src="resolveImageUrl(row.imageUrl) ?? ''"
          alt=""
          class="size-full object-cover"
        />
        <Headphones v-else class="size-5 text-fg-muted" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate font-medium text-fg">{{ row.name }}</p>
        <p class="mt-0.5 text-xs text-fg-muted">
          <Badge v-if="row.newAccessory" tone="primary">{{ t('receipts.lineNew') }}</Badge>
          <template v-else-if="row.currentQuantity != null">
            {{ t('receipts.quantityInStock', { n: row.currentQuantity }) }}
          </template>
        </p>
      </div>

      <button
        type="button"
        class="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
        :aria-label="t('receipts.removeLine')"
        @click="$emit('remove')"
      >
        <X class="size-4" />
      </button>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3">
      <AppInput v-model="row.quantity" :label="t('receipts.quantity')" inputmode="numeric" />
      <MoneyInput
        v-model="row.purchasePrice"
        :label="t('receipts.purchasePrice')"
        :hint="t('receipts.freeHint')"
      />
    </div>

    <p class="mt-2 text-right text-sm text-fg-muted">
      {{ t('sales.total') }}:
      <span class="font-bold text-fg tnum">{{ formatMoney(rowSubtotal(row)) }}</span>
    </p>
  </div>
</template>
