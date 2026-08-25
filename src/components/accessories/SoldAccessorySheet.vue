<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { Headphones, Phone, Undo2, Coins } from 'lucide-vue-next'
import type { AccessoryKind, Sale } from '@/api/types'
import { useSoldAccessory } from '@/composables/useAccessories'
import { useAccessorySales } from '@/composables/useSales'
import { formatMoney, formatNumber, formatDateTime, resolveImageUrl } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ReturnSheet from '@/components/sales/ReturnSheet.vue'

const props = withDefaults(defineProps<{ accessoryId: string; kind?: AccessoryKind }>(), {
  kind: 'ACCESSORY',
})
const open = defineModel<boolean>({ required: true })

const router = useRouter()

const fallbackIcon = computed(() => (props.kind === 'KEYPAD_PHONE' ? Phone : Headphones))

const { data, isLoading, isError, error, refetch } = useSoldAccessory(toRef(props, 'accessoryId'))

// Each sale that includes this product — so it can be returned or its price edited here.
// Scoped by kind because a keypad phone's sales are typed KEYPAD_PHONE, not ACCESSORY.
const { data: sales } = useAccessorySales(
  toRef(props, 'accessoryId'),
  toRef(props, 'kind'),
)
const saleRows = computed(() =>
  (sales.value ?? [])
    .map((sale) => {
      const item = sale.items.find((i) => i.product.id === props.accessoryId)
      return item ? { sale, item, returnable: item.quantity - item.returnedQuantity > 0 } : null
    })
    .filter((r): r is { sale: Sale; item: Sale['items'][number]; returnable: boolean } => r !== null),
)

const selectedSale = ref<Sale | null>(null)
const showReturn = ref(false)
function openReturn(sale: Sale) {
  selectedSale.value = sale
  showReturn.value = true
}

/** Jump to the sale page with edit mode auto-opened. */
function editPrice(sale: Sale) {
  open.value = false
  router.push({ name: 'sale-detail', params: { id: sale.id }, query: { edit: '1' } })
}
</script>

<template>
  <ModalSheet v-model="open" :title="data?.name ?? t('accessories.tabSold')">
    <DataState
      :loading="isLoading"
      :is-error="isError"
      :is-empty="false"
      :error-message="error ? toUserMessage(error) : undefined"
      @retry="refetch"
    >
      <template #skeleton>
        <div class="space-y-3">
          <SkeletonBlock class="h-20 rounded-xl" />
          <SkeletonBlock class="h-40 rounded-xl" />
        </div>
      </template>

      <div v-if="data" class="space-y-4">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <div
            class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2"
          >
            <img
              v-if="resolveImageUrl(data.imageUrl)"
              :src="resolveImageUrl(data.imageUrl) ?? ''"
              alt=""
              class="size-full object-cover"
            />
            <component :is="fallbackIcon" v-else class="size-6 text-fg-muted" />
          </div>
          <div class="min-w-0">
            <p class="truncate font-semibold text-fg">{{ data.name }}</p>
            <p class="text-xs text-fg-muted">
              {{ formatNumber(data.currentQuantity) }}
              {{ t('accessories.remaining').toLowerCase() }}
            </p>
          </div>
        </div>

        <!-- Totals -->
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div class="rounded-xl bg-surface-2 p-3">
            <p class="text-xs text-fg-muted">{{ t('accessories.soldCount') }}</p>
            <p class="mt-0.5 font-bold text-fg tnum">
              {{ formatNumber(data.soldQty) }} {{ t('accessories.unit') }}
            </p>
          </div>
          <div class="rounded-xl bg-surface-2 p-3">
            <p class="text-xs text-fg-muted">{{ t('accessories.soldAmount') }}</p>
            <p class="mt-0.5 font-bold text-fg tnum">{{ formatMoney(data.soldAmount) }}</p>
          </div>
          <div class="rounded-xl bg-success-soft p-3">
            <p class="text-xs text-success">{{ t('sales.profit') }}</p>
            <p class="mt-0.5 font-bold text-success tnum">{{ formatMoney(data.profit) }}</p>
          </div>
        </div>

        <!-- Sales — return each one individually -->
        <div>
          <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
            {{ t('returns.salesList') }}
          </h3>
          <div v-if="saleRows.length" class="overflow-hidden rounded-2xl border border-border">
            <div
              v-for="(row, i) in saleRows"
              :key="row.sale.id"
              class="flex items-center justify-between gap-3 px-4 py-3"
              :class="i > 0 ? 'border-t border-border' : ''"
            >
              <div class="min-w-0">
                <p class="font-semibold text-fg tnum">{{ row.sale.code }}</p>
                <p class="text-xs text-fg-muted tnum">
                  {{ formatNumber(row.item.quantity) }} × {{ formatMoney(row.item.unitPrice) }}
                  <span v-if="row.item.returnedQuantity > 0" class="text-danger">
                    · {{ t('sales.returnedQty') }}: {{ row.item.returnedQuantity }}
                  </span>
                </p>
                <p class="text-xs text-fg-muted">{{ formatDateTime(row.sale.soldAt) }}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-2">
                <AppButton size="sm" variant="secondary" @click="editPrice(row.sale)">
                  <template #icon><Coins class="size-4" /></template>
                  {{ t('sales.editPrice') }}
                </AppButton>
                <AppButton
                  v-if="row.returnable"
                  size="sm"
                  variant="secondary"
                  @click="openReturn(row.sale)"
                >
                  <template #icon><Undo2 class="size-4" /></template>
                  {{ t('returns.action') }}
                </AppButton>
              </div>
            </div>
          </div>
          <p v-else class="px-1 text-sm text-fg-muted">{{ t('returns.noSales') }}</p>
        </div>
      </div>
    </DataState>
  </ModalSheet>

  <ReturnSheet v-if="selectedSale" v-model="showReturn" :sale="selectedSale" />
</template>
