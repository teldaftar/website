<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Smartphone } from 'lucide-vue-next'
import type { Phone, PhoneListQuery } from '@/api/types'
import { usePhonesList } from '@/composables/usePhones'
import { formatMoney, formatMemory, resolveImageUrl } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ select: [phone: Phone] }>()
/** ids already in the cart — shown as disabled so the same phone isn't added twice. */
const props = defineProps<{ addedIds?: string[] }>()

const filters = reactive({ search: '' })
const query = computed<PhoneListQuery>(() => ({
  status: 'IN_STOCK',
  search: filters.search.trim() || undefined,
  sort: 'createdAt',
  order: 'DESC',
}))

const { items, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
  usePhonesList(query)

function added(id: string) {
  return props.addedIds?.includes(id) ?? false
}

function pick(phone: Phone) {
  if (added(phone.id)) return
  emit('select', phone)
  open.value = false
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('sales.pickPhone')">
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
          <EmptyState :icon="Smartphone" :title="t('phones.emptyTitle')" />
        </template>

        <div class="max-h-[55dvh] space-y-2 overflow-y-auto">
          <button
            v-for="phone in items"
            :key="phone.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-2.5 text-left transition-colors enabled:hover:bg-surface-2 disabled:opacity-45"
            :disabled="added(phone.id)"
            @click="pick(phone)"
          >
            <div
              class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
            >
              <img
                v-if="resolveImageUrl(phone.imageUrl)"
                :src="resolveImageUrl(phone.imageUrl) ?? ''"
                alt=""
                class="size-full object-cover"
              />
              <Smartphone v-else class="size-5 text-fg-muted" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-fg">{{ phone.name }}</p>
              <p class="truncate text-xs text-fg-muted">
                {{ formatMemory(phone.ramGb, phone.storageGb) || phone.imei || '—' }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-semibold text-fg tnum">
              {{ formatMoney(phone.listPrice ?? phone.purchasePrice) }}
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
