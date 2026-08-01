<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Headphones, Check } from 'lucide-vue-next'
import type { Accessory, AccessoryListQuery, SoldAccessoryListQuery } from '@/api/types'
import {
  useAccessoriesList,
  useSoldAccessoriesList,
  useDeleteAccessory,
} from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
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
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import AccessoryCard from '@/components/accessories/AccessoryCard.vue'
import AccessoryFormSheet from '@/components/accessories/AccessoryFormSheet.vue'
import StockFormSheet from '@/components/accessories/StockFormSheet.vue'
import SaleSheet from '@/components/sales/SaleSheet.vue'
import SoldAccessoryCard from '@/components/accessories/SoldAccessoryCard.vue'
import SoldAccessorySheet from '@/components/accessories/SoldAccessorySheet.vue'

const router = useRouter()

type Mode = 'current' | 'sold'
const mode = ref<Mode>('current')
const modeOptions = [
  { label: t('accessories.tabCurrent'), value: 'current' as const },
  { label: t('accessories.tabSold'), value: 'sold' as const },
]

const filters = reactive<{ search: string; inStock: boolean }>({ search: '', inStock: false })

// --- Current (in-stock) list ---
const currentQuery = computed<AccessoryListQuery>(() => ({
  search: filters.search.trim() || undefined,
  inStock: filters.inStock || undefined,
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
const selling = ref<Accessory | null>(null)
const showSale = ref(false)
const stocking = ref<Accessory | null>(null)
const showStock = ref(false)
const deleting = ref<Accessory | null>(null)
const showDelete = ref(false)
const deleteAccessory = useDeleteAccessory()

// Sold detail sheet.
const soldId = ref<string | null>(null)
const showSoldDetail = ref(false)

function add() {
  editing.value = null
  showForm.value = true
}
function edit(accessory: Accessory) {
  editing.value = accessory
  showForm.value = true
}
function sell(accessory: Accessory) {
  selling.value = accessory
  showSale.value = true
}
function addStock(accessory: Accessory) {
  stocking.value = accessory
  showStock.value = true
}
function askDelete(accessory: Accessory) {
  deleting.value = accessory
  showDelete.value = true
}
function openSold(accessoryId: string) {
  soldId.value = accessoryId
  showSoldDetail.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await deleteAccessory.mutateAsync(deleting.value.id)
    notify.success(t('app.delete'))
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    showDelete.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader :title="t('accessories.title')">
      <template #actions>
        <AppButton v-if="mode === 'current'" size="sm" @click="add">
          <template #icon><Plus class="size-4" /></template>
          {{ t('app.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageContainer wide>
      <div class="space-y-3">
        <Segmented v-model="mode" :options="modeOptions" />
        <SearchBar v-model="filters.search" />
        <button
          v-if="mode === 'current'"
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="
            filters.inStock
              ? 'border-primary bg-primary text-primary-fg'
              : 'border-border bg-surface text-fg-muted hover:text-fg'
          "
          @click="filters.inStock = !filters.inStock"
        >
          <Check v-if="filters.inStock" class="size-4" />
          {{ t('accessories.onlyInStock') }}
        </button>
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
          <div class="grid gap-3 lg:grid-cols-2">
            <SkeletonBlock v-for="i in 6" :key="i" class="h-32 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="Headphones"
            :title="t('accessories.emptyTitle')"
            :text="t('accessories.emptyText')"
          >
            <template #action>
              <AppButton @click="add">{{ t('accessories.add') }}</AppButton>
            </template>
          </EmptyState>
        </template>

        <TransitionGroup tag="div" name="list" class="grid gap-3 lg:grid-cols-2">
          <AccessoryCard
            v-for="accessory in current.items.value"
            :key="accessory.id"
            :accessory="accessory"
            @open="router.push({ name: 'accessory-detail', params: { id: accessory.id } })"
            @sell="sell(accessory)"
            @stock="addStock(accessory)"
            @edit="edit(accessory)"
            @remove="askDelete(accessory)"
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
          <div class="grid gap-3 lg:grid-cols-2">
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

        <TransitionGroup tag="div" name="list" class="grid gap-3 lg:grid-cols-2">
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

    <AccessoryFormSheet v-model="showForm" :accessory="editing ?? undefined" />
    <SaleSheet v-if="selling" v-model="showSale" :accessory="selling" />
    <StockFormSheet v-if="stocking" v-model="showStock" :accessory="stocking" />
    <SoldAccessorySheet v-if="soldId" v-model="showSoldDetail" :accessory-id="soldId" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('accessories.deleteConfirm')"
      danger
      :loading="deleteAccessory.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
