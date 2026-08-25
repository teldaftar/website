<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Headphones, ShoppingCart, Pencil } from 'lucide-vue-next'
import type { Accessory } from '@/api/types'
import { formatMoney, resolveImageUrl } from '@/lib/format'
import { t } from '@/i18n'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps<{ accessory: Accessory; icon?: Component }>()
defineEmits<{ open: []; sell: []; edit: [] }>()

const fallbackIcon = computed(() => props.icon ?? Headphones)

const image = computed(() => resolveImageUrl(props.accessory.imageUrl))
const inStock = computed(() => props.accessory.quantity > 0)

const stock = computed(() => {
  const q = props.accessory.quantity
  if (q <= 0) return { label: t('accessories.outOfStock'), tone: 'danger' as const }
  if (q <= 3) return { label: `${q} ${t('accessories.unit')}`, tone: 'warning' as const }
  return { label: `${q} ${t('accessories.unit')}`, tone: 'neutral' as const }
})
</script>

<template>
  <div class="flex h-full flex-col rounded-2xl border border-border bg-surface p-3">
    <!-- Tappable body → detail (grows so the actions pin to the bottom) -->
    <button class="flex w-full flex-1 gap-3 text-left" @click="$emit('open')">
      <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
        <img v-if="image" :src="image" alt="" class="size-full object-cover" />
        <component :is="fallbackIcon" v-else class="size-7 text-fg-muted" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate font-semibold text-fg">{{ accessory.name }}</p>
          <Badge :tone="stock.tone">{{ stock.label }}</Badge>
        </div>
        <p v-if="accessory.salePrice" class="mt-1 font-bold text-fg tnum">
          {{ formatMoney(accessory.salePrice) }}
        </p>
        <p v-else class="mt-1 text-sm text-fg-muted">{{ t('accessories.salePrice') }}: —</p>
      </div>
    </button>

    <!-- Quick actions (icon-only) -->
    <div class="mt-3 flex items-center gap-2 border-t border-border pt-3">
      <button
        v-if="inStock"
        class="grid size-9 place-items-center rounded-lg bg-primary text-primary-fg transition-transform active:scale-90"
        :aria-label="t('accessories.sell')"
        @click="$emit('sell')"
      >
        <ShoppingCart class="size-4.5" />
      </button>
      <button
        class="grid size-9 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        :aria-label="t('app.edit')"
        @click="$emit('edit')"
      >
        <Pencil class="size-4" />
      </button>
    </div>
  </div>
</template>
