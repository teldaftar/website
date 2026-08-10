<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Smartphone, ArrowDownUp } from 'lucide-vue-next'
import type { Phone, PhoneCondition, PhoneListQuery, PhoneStatus, SortOrder } from '@/api/types'
import { usePhonesList, useDeletePhone } from '@/composables/usePhones'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import Segmented from '@/components/ui/Segmented.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PhoneCard from '@/components/phones/PhoneCard.vue'
import PhoneFormSheet from '@/components/phones/PhoneFormSheet.vue'

const router = useRouter()

const filters = reactive<{
  search: string
  // Default view = phones currently in stock (for sale).
  status: PhoneStatus
  condition: PhoneCondition | undefined
  sort: 'createdAt' | 'name' | 'purchasePrice'
  order: SortOrder
}>({
  search: '',
  status: 'IN_STOCK',
  condition: undefined,
  sort: 'createdAt',
  order: 'DESC',
})

const query = computed<PhoneListQuery>(() => ({
  search: filters.search.trim() || undefined,
  status: filters.status,
  condition: filters.condition,
  sort: filters.sort,
  order: filters.order,
}))

const {
  items,
  total,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = usePhonesList(query)

const statusOptions = [
  { label: t('phones.inStock'), value: 'IN_STOCK' as const },
  { label: t('phones.sold'), value: 'SOLD' as const },
]
// Condition filter (Yangi / Ishlatilgan) is hidden for now — re-enable if needed.
// const conditionOptions = [
//   { label: t('phones.conditionNew'), value: 'NEW' as const },
//   { label: t('phones.conditionUsed'), value: 'USED' as const },
// ]
const sortOptions = [
  { label: t('phones.sortCreatedAt'), value: 'createdAt' as const },
  { label: t('phones.sortName'), value: 'name' as const },
  { label: t('phones.sortPrice'), value: 'purchasePrice' as const },
]

function toggleOrder() {
  filters.order = filters.order === 'DESC' ? 'ASC' : 'DESC'
}

// Sheets / dialogs operate on a selected phone straight from the list.
const showForm = ref(false)
const editing = ref<Phone | null>(null)
const deleting = ref<Phone | null>(null)
const showDelete = ref(false)
const deletePhone = useDeletePhone()

function add() {
  editing.value = null
  showForm.value = true
}
function edit(phone: Phone) {
  editing.value = phone
  showForm.value = true
}
function sell(phone: Phone) {
  // Selling is a cart flow now — hand off to the new-sale page with this phone pre-added.
  router.push({ name: 'sale-new', query: { phoneId: phone.id } })
}
function askDelete(phone: Phone) {
  deleting.value = phone
  showDelete.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await deletePhone.mutateAsync(deleting.value.id)
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
    <PageHeader :title="t('phones.title')" :subtitle="`${total} ta`">
      <template #actions>
        <AppButton size="sm" @click="add">
          <template #icon><Plus class="size-4" /></template>
          {{ t('app.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageContainer wide>
      <div class="space-y-3">
        <SearchBar v-model="filters.search" :placeholder="t('app.search')" />

        <!-- Condition filter (Yangi / Ishlatilgan) is hidden for now. -->
        <Segmented v-model="filters.status" :options="statusOptions" />

        <div class="flex items-center gap-2">
          <AppSelect v-model="filters.sort" :options="sortOptions" class="flex-1" />
          <button
            class="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-fg-muted transition-colors hover:text-fg"
            :aria-label="filters.order"
            @click="toggleOrder"
          >
            <ArrowDownUp class="size-5" :class="filters.order === 'ASC' ? 'rotate-180' : ''" />
          </button>
        </div>
      </div>

      <DataState
        class="mt-4"
        :loading="isLoading"
        :is-error="isError"
        :is-empty="items.length === 0"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SkeletonBlock v-for="i in 6" :key="i" class="h-36 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="Smartphone"
            :title="t('phones.emptyTitle')"
            :text="t('phones.emptyText')"
          >
            <template #action>
              <AppButton @click="add">{{ t('phones.add') }}</AppButton>
            </template>
          </EmptyState>
        </template>

        <TransitionGroup tag="div" name="list" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PhoneCard
            v-for="phone in items"
            :key="phone.id"
            :phone="phone"
            @open="router.push({ name: 'phone-detail', params: { id: phone.id } })"
            @sell="sell(phone)"
            @edit="edit(phone)"
            @label="router.push({ name: 'phone-label', params: { id: phone.id } })"
            @remove="askDelete(phone)"
          />
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!hasNextPage"
          :loading="isFetchingNextPage"
          @load="fetchNextPage()"
        />
      </DataState>
    </PageContainer>

    <PhoneFormSheet v-model="showForm" :phone="editing ?? undefined" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('phones.deleteConfirm')"
      danger
      :loading="deletePhone.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
