<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Headphones, Check } from 'lucide-vue-next'
import type { Accessory, AccessoryListQuery } from '@/api/types'
import { useAccessoriesList } from '@/composables/useAccessories'
import { formatCost, formatNumber, resolveImageUrl } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import AppButton from '@/components/ui/AppButton.vue'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ select: [accessory: Accessory]; remove: [accessory: Accessory] }>()
/** ids already in the cart — shown as selected; tapping again removes them. */
const props = defineProps<{ addedIds?: string[] }>()

const selectedCount = computed(() => props.addedIds?.length ?? 0)

const filters = reactive({ search: '' })
const query = computed<AccessoryListQuery>(() => ({
  search: filters.search.trim() || undefined,
  inStock: true,
}))

const { items, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useAccessoriesList(query)

function added(id: string) {
  return props.addedIds?.includes(id) ?? false
}

// Multiple accessories can be added in one go — the sheet stays open, tapping a
// selected row removes it. Finish with the footer "Tayyor" button.
function pick(accessory: Accessory) {
  emit(added(accessory.id) ? 'remove' : 'select', accessory)
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('sales.pickAccessory')">
    <div class="space-y-3">
      <SearchBar v-model="filters.search" />

      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="items.length === 0"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-2">
            <SkeletonBlock v-for="i in 5" :key="i" class="h-16 rounded-xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState :icon="Headphones" :title="t('accessories.emptyTitle')" />
        </template>

        <div class="max-h-[55dvh] space-y-2 overflow-y-auto">
          <button
            v-for="accessory in items"
            :key="accessory.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors"
            :class="
              added(accessory.id)
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface hover:bg-surface-2'
            "
            @click="pick(accessory)"
          >
            <div
              class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
            >
              <img
                v-if="resolveImageUrl(accessory.imageUrl)"
                :src="resolveImageUrl(accessory.imageUrl) ?? ''"
                alt=""
                class="size-full object-cover"
              />
              <Headphones v-else class="size-5 text-fg-muted" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-fg">{{ accessory.name }}</p>
              <p class="truncate text-xs text-fg-muted tnum">
                {{ formatNumber(accessory.quantity) }} {{ t('accessories.unit') }}
                {{ t('accessories.remaining').toLowerCase() }}
              </p>
            </div>
            <p
              v-if="accessory.salePrice && !added(accessory.id)"
              class="shrink-0 text-sm font-semibold text-fg tnum"
            >
              {{ formatCost(accessory.salePrice) }}
            </p>
            <span
              v-if="added(accessory.id)"
              class="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-fg"
            >
              <Check class="size-4" :stroke-width="3" />
            </span>
          </button>

          <InfiniteSentinel
            :disabled="!hasNextPage"
            :loading="isFetchingNextPage"
            @load="fetchNextPage()"
          />
        </div>
      </DataState>

      <div class="sticky bottom-0 -mx-5 -mb-6 border-t border-border bg-surface px-5 pt-3 pb-6 lg:-mb-5 lg:pb-5">
        <AppButton block size="lg" @click="open = false">
          <template #icon><Check class="size-5" /></template>
          {{ selectedCount ? t('sales.pickDoneCount', { n: selectedCount }) : t('sales.pickDone') }}
        </AppButton>
      </div>
    </div>
  </ModalSheet>
</template>
