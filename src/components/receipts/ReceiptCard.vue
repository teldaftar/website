<script setup lang="ts">
import { PackagePlus, Boxes, Layers, Truck } from 'lucide-vue-next'
import type { StockReceiptRow } from '@/api/types'
import { formatMoney, formatNumber, formatTime } from '@/lib/format'
import { t } from '@/i18n'
import Card from '@/components/ui/Card.vue'

defineProps<{ row: StockReceiptRow }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <Card interactive class="flex gap-3" @click="$emit('open')">
    <div class="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
      <PackagePlus class="size-5" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p class="truncate text-base font-bold text-fg tnum">{{ formatTime(row.receivedAt) }}</p>
        <p class="shrink-0 font-bold text-fg tnum">{{ formatMoney(row.totalAmount) }}</p>
      </div>

      <p class="mt-0.5 text-xs text-fg-muted tnum">{{ row.code }}</p>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
        <span class="inline-flex items-center gap-1">
          <Boxes class="size-3.5" />
          {{ formatNumber(row.totalQty) }} {{ t('accessories.unit') }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Layers class="size-3.5" />
          {{ t('receipts.itemCountValue', { n: row.itemCount }) }}
        </span>
        <span v-if="row.supplierName" class="inline-flex items-center gap-1 truncate">
          <Truck class="size-3.5 shrink-0" />
          <span class="truncate">{{ row.supplierName }}</span>
        </span>
      </div>
    </div>
  </Card>
</template>
