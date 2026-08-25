<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PackagePlus, Headphones, Truck, Phone, Pencil, Trash2 } from 'lucide-vue-next'
import { useStockReceipt, useDeleteStockReceipt } from '@/composables/useStockReceipts'
import {
  formatMoney,
  formatCost,
  formatNumber,
  formatDate,
  formatTime,
  formatPhone,
  resolveImageUrl,
} from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: receipt, isLoading, isError, error, refetch } = useStockReceipt(id)
const deleteReceipt = useDeleteStockReceipt()
const showDelete = ref(false)

function edit() {
  router.push({ name: 'receipt-edit', params: { id: id.value } })
}

async function onDelete() {
  try {
    await deleteReceipt.mutateAsync(id.value)
    notify.success(t('app.delete'))
    router.replace({ name: 'receipts' })
  } catch (err) {
    // Covers INSUFFICIENT_STOCK (sold-stock protection): delete keeps the old shape.
    notify.error(toUserMessage(err))
  } finally {
    showDelete.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader
      :title="
        receipt
          ? `${t('receipts.detailTitle')} · ${formatDate(receipt.receivedAt)}`
          : t('receipts.detailTitle')
      "
      back
    />
    <PageContainer>
      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="false"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-4">
            <SkeletonBlock class="h-40 rounded-2xl" />
            <SkeletonBlock class="h-48 rounded-2xl" />
          </div>
        </template>

        <div v-if="receipt" class="space-y-4">
          <!-- Header -->
          <Card>
            <div class="flex items-start gap-3">
              <div
                class="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
              >
                <PackagePlus class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xl font-bold text-fg tnum">{{ formatDate(receipt.receivedAt) }}</p>
                <p class="text-xs text-fg-muted tnum">
                  {{ formatTime(receipt.receivedAt) }} · {{ receipt.code }}
                </p>
              </div>
            </div>

            <!-- Supplier -->
            <div
              v-if="receipt.supplierName || receipt.supplierPhone"
              class="mt-3 space-y-1 border-t border-border pt-3 text-sm"
            >
              <p v-if="receipt.supplierName" class="flex items-center gap-2 text-fg">
                <Truck class="size-4 shrink-0 text-fg-muted" />
                {{ receipt.supplierName }}
              </p>
              <a
                v-if="receipt.supplierPhone"
                :href="`tel:${receipt.supplierPhone}`"
                class="flex items-center gap-2 text-primary"
              >
                <Phone class="size-4 shrink-0" />
                {{ formatPhone(receipt.supplierPhone) }}
              </a>
            </div>

            <p v-if="receipt.note" class="mt-3 text-sm text-fg-muted">{{ receipt.note }}</p>
          </Card>

          <!-- Totals -->
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div class="rounded-2xl bg-primary-soft p-3">
              <p class="text-xs text-primary">{{ t('receipts.totalAmount') }}</p>
              <p class="mt-0.5 font-bold text-primary tnum">
                {{ formatMoney(receipt.totalAmount) }}
              </p>
            </div>
            <div class="rounded-2xl bg-surface-2 p-3">
              <p class="text-xs text-fg-muted">{{ t('receipts.totalQty') }}</p>
              <p class="mt-0.5 font-bold text-fg tnum">
                {{ formatNumber(receipt.totalQty) }} {{ t('accessories.unit') }}
              </p>
            </div>
            <div class="rounded-2xl bg-surface-2 p-3">
              <p class="text-xs text-fg-muted">{{ t('receipts.itemCount') }}</p>
              <p class="mt-0.5 font-bold text-fg tnum">{{ formatNumber(receipt.itemCount) }}</p>
            </div>
          </div>

          <!-- Lines -->
          <div>
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('receipts.lines') }}</h3>
            <Card :padded="false" class="overflow-hidden">
              <div
                v-for="(item, i) in receipt.items"
                :key="item.id"
                class="flex items-center gap-3 px-4 py-3"
                :class="i > 0 ? 'border-t border-border' : ''"
              >
                <div
                  class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
                >
                  <img
                    v-if="resolveImageUrl(item.imageUrl)"
                    :src="resolveImageUrl(item.imageUrl) ?? ''"
                    alt=""
                    class="size-full object-cover"
                  />
                  <component
                    :is="item.kind === 'KEYPAD_PHONE' ? Phone : Headphones"
                    v-else
                    class="size-5 text-fg-muted"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-1.5 truncate font-medium text-fg">
                    {{ item.name }}
                    <Badge v-if="item.kind === 'KEYPAD_PHONE'" tone="info">
                      {{ t('sales.keypad') }}
                    </Badge>
                  </p>
                  <p class="text-xs text-fg-muted tnum">
                    {{ formatNumber(item.quantity) }} {{ t('accessories.unit') }} ×
                    <template v-if="item.purchasePrice === 0">
                      <Badge tone="success">{{ formatCost(0) }}</Badge>
                    </template>
                    <template v-else>{{ formatMoney(item.purchasePrice) }}</template>
                  </p>
                  <p class="text-xs text-fg-muted tnum">
                    {{ t('accessories.remaining') }}: {{ formatNumber(item.remaining) }}
                    {{ t('accessories.unit') }}
                  </p>
                </div>
                <p class="shrink-0 font-semibold text-fg tnum">{{ formatMoney(item.lineTotal) }}</p>
              </div>

              <!-- Sum -->
              <div
                class="flex items-center justify-between border-t border-border bg-surface-2/50 px-4 py-3"
              >
                <span class="text-sm font-medium text-fg-muted">{{
                  t('receipts.totalAmount')
                }}</span>
                <span class="font-bold text-fg tnum">{{ formatMoney(receipt.totalAmount) }}</span>
              </div>
            </Card>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3">
            <AppButton variant="secondary" @click="edit">
              <template #icon><Pencil class="size-4" /></template>
              {{ t('app.edit') }}
            </AppButton>
            <AppButton variant="danger" @click="showDelete = true">
              <template #icon><Trash2 class="size-4" /></template>
              {{ t('app.delete') }}
            </AppButton>
          </div>
        </div>
      </DataState>
    </PageContainer>

    <ConfirmDialog
      v-model="showDelete"
      :title="t('receipts.deleteConfirm')"
      danger
      :loading="deleteReceipt.isPending.value"
      @confirm="onDelete"
    />
  </div>
</template>
