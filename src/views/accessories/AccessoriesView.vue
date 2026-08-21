<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Headphones } from 'lucide-vue-next'
import type { Accessory, AccessoryListQuery, SoldAccessoryListQuery } from '@/api/types'
import { useAccessoriesList, useSoldAccessoriesList } from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import Segmented from '@/components/ui/Segmented.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AccessoryCard from '@/components/accessories/AccessoryCard.vue'
import AccessoryFormSheet from '@/components/accessories/AccessoryFormSheet.vue'
import SoldAccessoryCard from '@/components/accessories/SoldAccessoryCard.vue'
import SoldAccessorySheet from '@/components/accessories/SoldAccessorySheet.vue'

const router = useRouter()

type Mode = 'current' | 'sold'
const mode = ref<Mode>('current')
const modeOptions = [
  { label: t('accessories.tabCurrent'), value: 'current' as const },
  { label: t('accessories.tabSold'), value: 'sold' as const },
]

const filters = reactive<{ search: string }>({ search: '' })

// --- Current (in-stock) list ---
const currentQuery = computed<AccessoryListQuery>(() => ({
  search: filters.search.trim() || undefined,
}))
const current = useAccessoriesList(currentQuery)

// --- Sold list ---
const soldQuery = computed<SoldAccessoryListQuery>(() => ({
  search: filters.search.trim() || undefined,
}))
const sold = useSoldAccessoriesList(soldQuery)

// Sheets / dialogs (current mode) operate on a selected accessory.
const showForm = ref(false)
const editing = ref<Accessory | null>(null)

// Sold detail sheet.
const soldId = ref<string | null>(null)
const showSoldDetail = ref(false)

function edit(accessory: Accessory) {
  editing.value = accessory
  showForm.value = true
}
function sell(accessory: Accessory) {
  // Selling is a cart flow now — open the new-sale page and jump to this accessory's batches.
  router.push({ name: 'sale-new', query: { accessoryId: accessory.id } })
}
function openSold(accessoryId: string) {
  soldId.value = accessoryId
  showSoldDetail.value = true
}
</script>

<template>
  <div>
    <PageHeader :title="t('accessories.title')" />

    <PageContainer wide>
      <div class="space-y-3">
        <Segmented v-model="mode" :options="modeOptions" />
        <SearchBar v-model="filters.search" />
      </div>

      <!-- Current (in-stock) -->
      <DataState
        v-if="mode === 'current'"
        class="mt-4"
        :loading="current.isLoading.value"
        :is-error="current.isError.value"
        :is-empty="current.items.value.length === 0"
        :error-message="current.error.value ? toUserMessage(current.error.value) : undefined"
        @retry="current.refetch()"
      >
        <template #skeleton>
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SkeletonBlock v-for="i in 6" :key="i" class="h-32 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="Headphones"
            :title="t('accessories.emptyTitle')"
            :text="t('accessories.emptyViaReceipt')"
          >
            <template #action>
              <AppButton @click="router.push({ name: 'receipt-new' })">
                {{ t('receipts.new') }}
              </AppButton>
            </template>
          </EmptyState>
        </template>

        <TransitionGroup tag="div" name="list" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AccessoryCard
            v-for="accessory in current.items.value"
            :key="accessory.id"
            :accessory="accessory"
            @open="router.push({ name: 'accessory-detail', params: { id: accessory.id } })"
            @sell="sell(accessory)"
            @edit="edit(accessory)"
          />
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!current.hasNextPage.value"
          :loading="current.isFetchingNextPage.value"
          @load="current.fetchNextPage()"
        />
      </DataState>

      <!-- Sold -->
      <DataState
        v-else
        class="mt-4"
        :loading="sold.isLoading.value"
        :is-error="sold.isError.value"
        :is-empty="sold.items.value.length === 0"
        :error-message="sold.error.value ? toUserMessage(sold.error.value) : undefined"
        @retry="sold.refetch()"
      >
        <template #skeleton>
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SkeletonBlock v-for="i in 6" :key="i" class="h-28 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="Headphones"
            :title="t('accessories.emptySoldTitle')"
            :text="t('accessories.emptySoldText')"
          />
        </template>

        <TransitionGroup tag="div" name="list" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <SoldAccessoryCard
            v-for="row in sold.items.value"
            :key="row.accessoryId"
            :row="row"
            @open="openSold(row.accessoryId)"
          />
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!sold.hasNextPage.value"
          :loading="sold.isFetchingNextPage.value"
          @load="sold.fetchNextPage()"
        />
      </DataState>
    </PageContainer>

    <AccessoryFormSheet v-if="editing" v-model="showForm" :accessory="editing" />
    <SoldAccessorySheet v-if="soldId" v-model="showSoldDetail" :accessory-id="soldId" />
  </div>
</template>
