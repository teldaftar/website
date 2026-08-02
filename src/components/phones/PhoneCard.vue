<script setup lang="ts">
import { computed } from 'vue'
import { Smartphone, ShoppingCart, Pencil, Tag, Trash2 } from 'lucide-vue-next'
import type { Phone } from '@/api/types'
import { formatMoney, formatMemory, resolveImageUrl } from '@/lib/format'
import { phoneCondition, phoneStatus } from '@/lib/labels'
import { t } from '@/i18n'
import Badge from '@/components/ui/Badge.vue'

const props = defineProps<{ phone: Phone }>()
defineEmits<{ open: []; sell: []; edit: []; label: []; remove: [] }>()

const memory = computed(() => formatMemory(props.phone.ramGb, props.phone.storageGb))
const status = computed(() => phoneStatus(props.phone.status))
const condition = computed(() =>
  props.phone.condition ? phoneCondition(props.phone.condition) : null,
)
const image = computed(() => resolveImageUrl(props.phone.imageUrl))
const inStock = computed(() => props.phone.status === 'IN_STOCK')
</script>

<template>
  <div class="flex h-full flex-col rounded-2xl border border-border bg-surface p-3">
    <!-- Tappable body → detail (grows so the actions pin to the bottom) -->
    <button class="flex w-full flex-1 gap-3 text-left" @click="$emit('open')">
      <div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
        <img v-if="image" :src="image" alt="" class="size-full object-cover" />
        <Smartphone v-else class="size-7 text-fg-muted" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="truncate font-semibold text-fg">{{ phone.name }}</p>
          <Badge :tone="status.tone">{{ status.label }}</Badge>
        </div>
        <p v-if="memory" class="mt-0.5 text-sm text-fg-muted">{{ memory }}</p>
        <p v-if="phone.imei" class="truncate text-xs text-fg-muted/80 tnum">
          IMEI: {{ phone.imei }}
        </p>
        <!-- In stock: purchase price + condition -->
        <div v-if="inStock" class="mt-1.5 flex items-center justify-between gap-2">
          <span class="font-bold text-fg tnum">{{ formatMoney(phone.purchasePrice) }}</span>
          <Badge v-if="condition" :tone="condition.tone">{{ condition.label }}</Badge>
        </div>
        <!-- Sold: olingan / sotilgan / foyda side by side -->
        <div v-else>
          <div class="mt-1.5 grid grid-cols-3 gap-1 text-[11px] leading-tight">
            <div>
              <p class="text-fg-muted">{{ t('phones.bought') }}</p>
              <p class="font-bold text-fg tnum">{{ formatMoney(phone.purchasePrice) }}</p>
            </div>
            <div>
              <p class="text-fg-muted">{{ t('phones.soldFor') }}</p>
              <p class="font-bold text-fg tnum">{{ formatMoney(phone.salePrice) }}</p>
            </div>
            <div>
              <p class="text-fg-muted">{{ t('sales.profit') }}</p>
              <p class="font-bold text-success tnum">{{ formatMoney(phone.profit) }}</p>
            </div>
          </div>
          <p
            v-if="phone.debt && phone.debt.amount > 0"
            class="mt-1.5 text-[11px] font-semibold text-warning"
          >
            {{ t('debts.owed') }}: {{ formatMoney(phone.debt.amount) }}
          </p>
        </div>
      </div>
    </button>

    <!-- Quick actions (icon-only) -->
    <div class="mt-3 flex items-center gap-2 border-t border-border pt-3">
      <button
        v-if="inStock"
        class="grid size-9 place-items-center rounded-lg bg-primary text-primary-fg transition-transform active:scale-90"
        :aria-label="t('phones.sell')"
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
      <button
        class="grid size-9 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        :aria-label="t('phones.printLabel')"
        @click="$emit('label')"
      >
        <Tag class="size-4" />
      </button>
      <button
        v-if="inStock"
        class="ml-auto grid size-9 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
        :aria-label="t('app.delete')"
        @click="$emit('remove')"
      >
        <Trash2 class="size-4" />
      </button>
    </div>
  </div>
</template>
