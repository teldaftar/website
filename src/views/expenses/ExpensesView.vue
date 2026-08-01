<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-vue-next'
import type { Expense, ExpenseListQuery } from '@/api/types'
import { useExpensesList, useDeleteExpense } from '@/composables/useExpenses'
import { toUserMessage } from '@/api/errors'
import { formatMoney, formatDate, currentMonthRange } from '@/lib/format'
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
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import ExpenseFormSheet from '@/components/expenses/ExpenseFormSheet.vue'

const range = ref<DateRange>(currentMonthRange())
const filters = reactive({ search: '' })

const query = computed<ExpenseListQuery>(() => ({
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
} = useExpensesList(query)

// Client-side total of the fetched range.
const rangeTotal = computed(() => items.value.reduce((sum, e) => sum + e.amount, 0))

const deleteExpense = useDeleteExpense()
const showForm = ref(false)
const editing = ref<Expense | null>(null)
const showDelete = ref(false)
const deleting = ref<Expense | null>(null)

function add() {
  editing.value = null
  showForm.value = true
}
function edit(expense: Expense) {
  editing.value = expense
  showForm.value = true
}
function askDelete(expense: Expense) {
  deleting.value = expense
  showDelete.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await deleteExpense.mutateAsync(deleting.value.id)
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
    <PageHeader :title="t('expenses.title')" back>
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

      <!-- Range total -->
      <div class="mt-4 flex items-center justify-between rounded-2xl bg-primary-soft px-4 py-3">
        <span class="text-sm font-medium text-primary">{{ t('expenses.total') }}</span>
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
            <SkeletonBlock v-for="i in 5" :key="i" class="h-16 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="Receipt"
            :title="t('expenses.emptyTitle')"
            :text="t('expenses.emptyText')"
          />
        </template>

        <TransitionGroup tag="div" name="list" class="space-y-3">
          <Card v-for="expense in items" :key="expense.id" class="flex items-center gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-fg">{{ expense.note }}</p>
              <p class="text-xs text-fg-muted">{{ formatDate(expense.spentAt) }}</p>
            </div>
            <span class="shrink-0 font-bold text-fg tnum">{{ formatMoney(expense.amount) }}</span>
            <div class="flex shrink-0 gap-1">
              <button
                class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                :aria-label="t('app.edit')"
                @click="edit(expense)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                :aria-label="t('app.delete')"
                @click="askDelete(expense)"
              >
                <Trash2 class="size-4" />
              </button>
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

    <ExpenseFormSheet v-model="showForm" :expense="editing ?? undefined" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('expenses.deleteConfirm')"
      danger
      :loading="deleteExpense.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
