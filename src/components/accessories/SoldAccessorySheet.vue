<script setup lang="ts">
import { toRef } from 'vue'
import { Headphones } from 'lucide-vue-next'
import { useSoldAccessory } from '@/composables/useAccessories'
import { formatMoney, formatNumber, resolveImageUrl } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'

const props = defineProps<{ accessoryId: string }>()
const open = defineModel<boolean>({ required: true })

const { data, isLoading, isError, error, refetch } = useSoldAccessory(toRef(props, 'accessoryId'))
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
            <Headphones v-else class="size-6 text-fg-muted" />
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

        <!-- Price breakdown -->
        <div>
          <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
            {{ t('accessories.breakdown') }}
          </h3>
          <div class="overflow-hidden rounded-2xl border border-border">
            <div
              v-for="(line, i) in data.lines"
              :key="i"
              class="flex items-center justify-between gap-3 px-4 py-3"
              :class="i > 0 ? 'border-t border-border' : ''"
            >
              <div class="min-w-0">
                <p class="font-semibold text-fg tnum">
                  {{ formatMoney(line.unitPrice) }} × {{ formatNumber(line.quantity) }}
                </p>
                <p class="text-xs text-fg-muted tnum">
                  {{ t('accessories.soldCost') }}: {{ formatMoney(line.costPrice) }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="font-bold text-fg tnum">{{ formatMoney(line.amount) }}</p>
                <p class="text-xs font-medium text-success tnum">+{{ formatMoney(line.profit) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DataState>
  </ModalSheet>
</template>
