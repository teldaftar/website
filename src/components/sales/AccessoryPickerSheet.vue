<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Headphones } from 'lucide-vue-next'
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

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ select: [accessory: Accessory] }>()
/** ids already in the cart — disabled so the same accessory isn't added twice. */
const props = defineProps<{ addedIds?: string[] }>()

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

function pick(accessory: Accessory) {
  if (added(accessory.id)) return
  emit('select', accessory)
  open.value = false
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
            class="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-2.5 text-left transition-colors enabled:hover:bg-surface-2 disabled:opacity-45"
            :disabled="added(accessory.id)"
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
            <p v-if="accessory.salePrice" class="shrink-0 text-sm font-semibold text-fg tnum">
              {{ formatCost(accessory.salePrice) }}
            </p>
          </button>

          <InfiniteSentinel
            :disabled="!hasNextPage"
            :loading="isFetchingNextPage"
            @load="fetchNextPage()"
          />
        </div>
      </DataState>
    </div>
  </ModalSheet>
</template>
