<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Headphones, Pencil, Trash2, ShoppingCart } from 'lucide-vue-next'
import { useAccessory, useStockHistory, useDeleteAccessory } from '@/composables/useAccessories'
import { formatMoney, formatCost, formatNumber, formatDate, resolveImageUrl } from '@/lib/format'
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
import AccessoryFormSheet from '@/components/accessories/AccessoryFormSheet.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: accessory, isLoading, isError, error, refetch } = useAccessory(id)
const { data: history } = useStockHistory(id)
const deleteAccessory = useDeleteAccessory()

const showEdit = ref(false)
const showDelete = ref(false)

const stockTone = computed(() => {
  const q = accessory.value?.quantity ?? 0
  return q <= 0 ? 'danger' : q <= 3 ? 'warning' : 'neutral'
})

async function onDelete() {
  if (!accessory.value) return
  try {
    await deleteAccessory.mutateAsync(accessory.value.id)
    notify.success(t('app.delete'))
    router.replace({ name: 'accessories' })
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    showDelete.value = false
  }
}

function sell() {
  if (!accessory.value) return
  router.push({ name: 'sale-new', query: { accessoryId: accessory.value.id } })
}
</script>

<template>
  <div>
    <PageHeader :title="accessory?.name ?? t('accessories.title')" back />
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
            <SkeletonBlock class="h-44 rounded-2xl" />
            <SkeletonBlock class="h-40 rounded-2xl" />
          </div>
        </template>

        <div v-if="accessory" class="space-y-4">
          <Card>
            <div class="flex gap-4">
              <div
                class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2"
              >
                <img
                  v-if="resolveImageUrl(accessory.imageUrl)"
                  :src="resolveImageUrl(accessory.imageUrl) ?? ''"
                  alt=""
                  class="size-full object-cover"
                />
                <Headphones v-else class="size-8 text-fg-muted" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <h2 class="text-lg font-bold text-fg">{{ accessory.name }}</h2>
                  <Badge :tone="stockTone">
                    {{ formatNumber(accessory.quantity) }} {{ t('accessories.unit') }}
                  </Badge>
                </div>
                <div class="mt-2 space-y-1 text-sm">
                  <div class="flex justify-between gap-2">
                    <span class="text-fg-muted">{{ t('accessories.salePrice') }}</span>
                    <span class="font-semibold text-fg tnum">
                      {{ accessory.salePrice ? formatMoney(accessory.salePrice) : '—' }}
                    </span>
                  </div>
                  <div class="flex justify-between gap-2">
                    <span class="text-fg-muted">{{ t('accessories.purchasePrice') }}</span>
                    <span class="text-fg tnum">{{ formatCost(accessory.purchasePrice) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="accessory.note" class="mt-3 text-sm text-fg-muted">{{ accessory.note }}</p>
          </Card>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3">
            <AppButton
              v-if="accessory.quantity > 0"
              size="lg"
              class="col-span-2"
              @click="sell"
            >
              <template #icon><ShoppingCart class="size-5" /></template>
              {{ t('accessories.sell') }}
            </AppButton>
            <AppButton variant="secondary" class="col-span-2" @click="showEdit = true">
              <template #icon><Pencil class="size-4" /></template>
              {{ t('app.edit') }}
            </AppButton>
            <AppButton variant="danger" class="col-span-2" @click="showDelete = true">
              <template #icon><Trash2 class="size-4" /></template>
              {{ t('app.delete') }}
            </AppButton>
          </div>

          <!-- Stock history -->
          <div>
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
              {{ t('accessories.stockHistory') }}
            </h3>
            <Card v-if="history && history.length" :padded="false" class="overflow-hidden">
              <div
                v-for="(entry, i) in history"
                :key="entry.id"
                class="flex items-center justify-between gap-3 px-4 py-3"
                :class="i > 0 ? 'border-t border-border' : ''"
              >
                <div class="min-w-0">
                  <p class="font-semibold text-fg">
                    +{{ formatNumber(entry.quantity) }} {{ t('accessories.unit') }}
                  </p>
                  <p class="text-xs text-fg-muted tnum">
                    {{ t('accessories.remaining') }}:
                    {{ formatNumber(entry.remainingQuantity) }} {{ t('accessories.unit') }}
                  </p>
                  <p v-if="entry.note" class="truncate text-xs text-fg-muted">{{ entry.note }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-fg tnum">
                    {{ formatCost(entry.purchasePrice) }}
                  </p>
                  <p class="text-xs text-fg-muted">{{ formatDate(entry.createdAt) }}</p>
                </div>
              </div>
            </Card>
            <p v-else class="px-1 text-sm text-fg-muted">—</p>
          </div>
        </div>
      </DataState>
    </PageContainer>

    <AccessoryFormSheet v-if="accessory" v-model="showEdit" :accessory="accessory" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('accessories.deleteConfirm')"
      danger
      :loading="deleteAccessory.isPending.value"
      @confirm="onDelete"
    />
  </div>
</template>
