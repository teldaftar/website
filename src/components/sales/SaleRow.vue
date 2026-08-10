<script setup lang="ts">
import { computed } from 'vue'
import { Smartphone, Headphones, User } from 'lucide-vue-next'
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
  // Multi-item / mixed sale: summarise by count instead of the first product's specs.
  if (props.sale.items.length > 1) return t('sales.itemCount', { n: props.sale.items.length })
  const p = product.value
  if (!p) return ''
  if (props.sale.type === 'ACCESSORY')
    return `${item.value?.quantity ?? 1} ${t('accessories.unit')}`
  return p.memory || p.imei || ''
})
const status = computed(() => saleStatus(props.sale.status))
/** Customer name — from the sale, falling back to the debt customer. */
const customer = computed(() => props.sale.customerName || props.sale.debt?.customerName || '')
/** Remaining debt (falls back to the initial amount if `debt` isn't embedded). */
const remainingDebt = computed(() => props.sale.debt?.amount ?? props.sale.debtAmount)
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
        <p v-if="customer" class="mt-0.5 flex items-center gap-1 truncate text-xs text-fg-muted">
          <User class="size-3 shrink-0" />{{ customer }}
        </p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <span class="font-bold text-fg tnum">{{ formatMoney(sale.totalAmount) }}</span>
          <span class="text-xs text-fg-muted">{{ formatDate(sale.soldAt) }}</span>
        </div>
      </div>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <Badge :tone="status.tone">{{ status.label }}</Badge>
      <Badge v-if="remainingDebt > 0" tone="warning">
        {{ t('debts.owed') }}: {{ formatMoney(remainingDebt) }}
      </Badge>
      <Badge v-if="sale.profit != null" tone="success">
        {{ t('sales.profit') }}: {{ formatMoney(sale.profit) }}
      </Badge>
    </div>
  </div>
</template>
