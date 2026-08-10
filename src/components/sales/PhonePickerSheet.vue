<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Smartphone, Check } from 'lucide-vue-next'
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
import AppButton from '@/components/ui/AppButton.vue'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ select: [phone: Phone]; remove: [phone: Phone] }>()
/** ids already in the cart — shown as selected; tapping again removes them. */
const props = defineProps<{ addedIds?: string[] }>()

const selectedCount = computed(() => props.addedIds?.length ?? 0)

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

// Multiple phones can be added in one go — the sheet stays open, tapping a
// selected row removes it. Finish with the footer "Tayyor" button.
function pick(phone: Phone) {
  emit(added(phone.id) ? 'remove' : 'select', phone)
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
            class="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors"
            :class="
              added(phone.id)
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface hover:bg-surface-2'
            "
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
            <p v-if="!added(phone.id)" class="shrink-0 text-sm font-semibold text-fg tnum">
              {{ formatMoney(phone.listPrice ?? phone.purchasePrice) }}
            </p>
            <span
              v-else
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
