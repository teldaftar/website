<script setup lang="ts">
import { computed } from 'vue'
import { Headphones } from 'lucide-vue-next'
import type { SoldAccessoryRow } from '@/api/types'
import { formatMoney, formatNumber, resolveImageUrl } from '@/lib/format'
import { t } from '@/i18n'

const props = defineProps<{ row: SoldAccessoryRow }>()
defineEmits<{ open: [] }>()

const image = computed(() => resolveImageUrl(props.row.imageUrl))
</script>

<template>
  <button
    class="flex w-full gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-[transform,box-shadow] duration-150 hover:shadow-md active:scale-[.99]"
    @click="$emit('open')"
  >
    <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
      <img v-if="image" :src="image" alt="" class="size-full object-cover" />
      <Headphones v-else class="size-7 text-fg-muted" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p class="truncate font-semibold text-fg">{{ row.name }}</p>
        <span class="shrink-0 text-xs font-medium text-success">
          {{ formatNumber(row.soldQty) }} {{ t('accessories.unit') }}
          {{ t('accessories.tabSold').toLowerCase() }}
        </span>
      </div>

      <div class="mt-1.5 grid grid-cols-3 gap-1 text-[11px] leading-tight">
        <div>
          <p class="text-fg-muted">{{ t('accessories.remaining') }}</p>
          <p class="font-bold text-fg tnum">
            {{ formatNumber(row.currentQuantity) }} {{ t('accessories.unit') }}
          </p>
        </div>
        <div>
          <p class="text-fg-muted">{{ t('accessories.soldAmount') }}</p>
          <p class="font-bold text-fg tnum">{{ formatMoney(row.soldAmount) }}</p>
        </div>
        <div>
          <p class="text-fg-muted">{{ t('sales.profit') }}</p>
          <p class="font-bold text-success tnum">{{ formatMoney(row.profit) }}</p>
        </div>
      </div>
    </div>
  </button>
</template>
