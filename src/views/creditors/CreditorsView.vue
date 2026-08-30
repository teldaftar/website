<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, HandCoins, Pencil, Trash2, Phone, AlertTriangle } from 'lucide-vue-next'
import type { Creditor, CreditorListQuery } from '@/api/types'
import { useCreditorsList, useDeleteCreditor } from '@/composables/useCreditors'
import { toUserMessage } from '@/api/errors'
import { formatMoney, formatDate, formatPhone, todayISO, currentMonthRange } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DateRangePicker, { type DateRange } from '@/components/ui/DateRangePicker.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import InfiniteSentinel from '@/components/ui/InfiniteSentinel.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import CreditorFormSheet from '@/components/creditors/CreditorFormSheet.vue'

const range = ref<DateRange>(currentMonthRange())
const filters = reactive({ search: '' })

const query = computed<CreditorListQuery>(() => ({
  from: range.value.from,
  to: range.value.to,
  search: filters.search.trim() || undefined,
}))

const {
  items,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useCreditorsList(query)

// Client-side total of the fetched range (how much the shop owes in it).
const rangeTotal = computed(() => items.value.reduce((sum, c) => sum + c.amount, 0))

// Overdue is a pure frontend concept: due date already past (shop time).
const today = computed(() => todayISO())
function isOverdue(c: Creditor): boolean {
  return c.dueDate < today.value
}

const deleteCreditor = useDeleteCreditor()
const showForm = ref(false)
const editing = ref<Creditor | null>(null)
const showDelete = ref(false)
const deleting = ref<Creditor | null>(null)

function add() {
  editing.value = null
  showForm.value = true
}
function edit(creditor: Creditor) {
  editing.value = creditor
  showForm.value = true
}
function askDelete(creditor: Creditor) {
  deleting.value = creditor
  showDelete.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await deleteCreditor.mutateAsync(deleting.value.id)
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
    <PageHeader :title="t('creditors.title')" back>
      <template #actions>
        <AppButton size="sm" @click="add">
          <template #icon><Plus class="size-4" /></template>
          {{ t('app.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageContainer>
      <div class="space-y-3">
        <DateRangePicker v-model="range" />
        <SearchBar v-model="filters.search" />
      </div>

      <!-- Range total (total owed in the selected range) -->
      <div class="mt-4 flex items-center justify-between rounded-2xl bg-primary-soft px-4 py-3">
        <span class="text-sm font-medium text-primary">{{ t('creditors.total') }}</span>
        <span class="text-lg font-bold text-primary tnum">{{ formatMoney(rangeTotal) }}</span>
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
          <div class="space-y-3">
            <SkeletonBlock v-for="i in 5" :key="i" class="h-24 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="HandCoins"
            :title="t('creditors.emptyTitle')"
            :text="t('creditors.emptyText')"
          />
        </template>

        <TransitionGroup tag="div" name="list" class="space-y-3">
          <Card v-for="c in items" :key="c.id" class="flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-semibold text-fg">{{ c.creditorName }}</p>
                <Badge v-if="isOverdue(c)" tone="danger">
                  <AlertTriangle class="mr-0.5 inline size-3" />{{ t('creditors.overdue') }}
                </Badge>
              </div>

              <p class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-fg-muted">
                <span>{{ t('creditors.borrowedShort') }}: {{ formatDate(c.borrowedAt) }}</span>
                <span :class="isOverdue(c) ? 'font-semibold text-danger' : ''">
                  {{ t('creditors.dueShort') }}: {{ formatDate(c.dueDate) }}
                </span>
              </p>

              <a
                v-if="c.phone"
                :href="`tel:${c.phone}`"
                class="mt-1 inline-flex items-center gap-1 text-xs text-primary tnum"
              >
                <Phone class="size-3" />{{ formatPhone(c.phone) }}
              </a>
              <p v-if="c.note" class="mt-0.5 truncate text-xs text-fg-muted">{{ c.note }}</p>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-2">
              <span class="font-bold text-fg tnum">{{ formatMoney(c.amount) }}</span>
              <div class="flex gap-1">
                <button
                  class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  :aria-label="t('app.edit')"
                  @click="edit(c)"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  :aria-label="t('app.delete')"
                  @click="askDelete(c)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </div>
          </Card>
        </TransitionGroup>

        <InfiniteSentinel
          :disabled="!hasNextPage"
          :loading="isFetchingNextPage"
          @load="fetchNextPage()"
        />
      </DataState>
    </PageContainer>

    <CreditorFormSheet v-model="showForm" :creditor="editing ?? undefined" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('creditors.deleteConfirm')"
      danger
      :loading="deleteCreditor.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
