<script setup lang="ts">
import { computed } from 'vue'
import { Smartphone, Headphones } from 'lucide-vue-next'
import type { Sale } from '@/api/types'
import { formatMoney, formatDate, resolveImageUrl } from '@/lib/format'
import { saleStatus } from '@/lib/labels'
import { t } from '@/i18n'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps<{ sale: Sale }>()

const item = computed(() => props.sale.items[0])
const product = computed(() => item.value?.product)
const image = computed(() => resolveImageUrl(product.value?.imageUrl))
const subtitle = computed(() => {
  const p = product.value
  if (!p) return ''
  if (props.sale.type === 'ACCESSORY')
    return `${item.value?.quantity ?? 1} ${t('accessories.unit')}`
  return p.memory || p.imei || ''
})
const status = computed(() => saleStatus(props.sale.status))
</script>

<template>
  <div
    class="rounded-2xl border border-border bg-surface p-3 transition-[transform,box-shadow] duration-150 hover:shadow-md active:scale-[.99]"
  >
    <div class="flex gap-3">
      <div class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
        <img v-if="image" :src="image" alt="" class="size-full object-cover" />
        <component
          :is="sale.type === 'PHONE' ? Smartphone : Headphones"
          v-else
          class="size-6 text-fg-muted"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate font-semibold text-fg">{{ product?.name ?? '—' }}</p>
          <span class="shrink-0 text-xs text-fg-muted tnum">{{ sale.code }}</span>
        </div>
        <p v-if="subtitle" class="truncate text-xs text-fg-muted">{{ subtitle }}</p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-bold text-fg tnum">{{ formatMoney(sale.totalAmount) }}</span>
          <span class="text-xs text-fg-muted">{{ formatDate(sale.soldAt) }}</span>
        </div>
      </div>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <Badge :tone="status.tone">{{ status.label }}</Badge>
      <Badge v-if="sale.debtAmount > 0" tone="warning">
        {{ t('debts.owed') }}: {{ formatMoney(sale.debtAmount) }}
      </Badge>
      <Badge v-if="sale.profit != null" tone="success">
        {{ t('sales.profit') }}: {{ formatMoney(sale.profit) }}
      </Badge>
    </div>
  </div>
</template>
