<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus, NotebookPen, Pencil, Trash2, Phone, AlertTriangle } from 'lucide-vue-next'
import type { DebtBookEntry, DebtBookListQuery } from '@/api/types'
import {
  debtBookErrorMessage,
  useDebtBookPage,
  useDeleteDebtBookEntry,
} from '@/composables/useDebtBook'
import { formatMoney, formatDate, formatPhone, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DateRangePicker, { type DateRange } from '@/components/ui/DateRangePicker.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import DebtBookFormSheet from '@/components/debtBook/DebtBookFormSheet.vue'

const PAGE_SIZE = 20

// No date filter by default — the book is a running list, not a monthly report.
const range = ref<DateRange>({ from: '', to: '' })
const filters = reactive({ search: '' })
const page = ref(1)

// Any filter change starts over from the first page.
watch(
  () => [range.value.from, range.value.to, filters.search],
  () => {
    page.value = 1
  },
)

const query = computed<DebtBookListQuery>(() => ({
  page: page.value,
  limit: PAGE_SIZE,
  from: range.value.from || undefined,
  to: range.value.to || undefined,
  search: filters.search.trim() || undefined,
}))

const { data, isLoading, isFetching, isError, error, refetch } = useDebtBookPage(query)

const items = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.meta.totalPages ?? 1)
const pageTotal = computed(() => items.value.reduce((sum, e) => sum + e.amount, 0))

// Deleting the last row of the last page leaves us past the end — step back.
watch(totalPages, (n) => {
  if (n >= 1 && page.value > n) page.value = n
})

// Due status is a frontend concept, compared in shop time (Asia/Tashkent).
type DueStatus = 'overdue' | 'today' | 'upcoming' | 'none'
const today = computed(() => todayISO())
function dueStatus(e: DebtBookEntry): DueStatus {
  if (!e.dueDate) return 'none'
  if (e.dueDate < today.value) return 'overdue'
  if (e.dueDate === today.value) return 'today'
  return 'upcoming'
}

/** `tel:` target — international form when the number is a full Uzbek one. */
function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `tel:${digits.length === 12 && digits.startsWith('998') ? `+${digits}` : phone}`
}

const deleteEntry = useDeleteDebtBookEntry()
const showForm = ref(false)
const editing = ref<DebtBookEntry | null>(null)
const showDelete = ref(false)
const deleting = ref<DebtBookEntry | null>(null)

function add() {
  editing.value = null
  showForm.value = true
}
function edit(entry: DebtBookEntry) {
  editing.value = entry
  showForm.value = true
}
function askDelete(entry: DebtBookEntry) {
  deleting.value = entry
  showDelete.value = true
}
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await deleteEntry.mutateAsync(deleting.value.id)
    notify.success(t('debtBook.deleted'))
  } catch (err) {
    notify.error(debtBookErrorMessage(err))
  } finally {
    showDelete.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader :title="t('debtBook.title')" back>
      <template #actions>
        <AppButton size="sm" @click="add">
          <template #icon><Plus class="size-4" /></template>
          {{ t('debtBook.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <PageContainer wide>
      <div class="space-y-3">
        <SearchBar v-model="filters.search" :delay="300" />
        <DateRangePicker v-model="range" allow-all />
      </div>

      <!-- Sum of the amounts on the current page -->
      <div class="mt-4 flex items-center justify-between rounded-2xl bg-primary-soft px-4 py-3">
        <span class="text-sm font-medium text-primary">{{ t('debtBook.pageTotal') }}</span>
        <span class="text-lg font-bold text-primary tnum">{{ formatMoney(pageTotal) }}</span>
      </div>

      <DataState
        class="mt-4"
        :loading="isLoading"
        :is-error="isError"
        :is-empty="items.length === 0"
        :error-message="error ? debtBookErrorMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-3">
            <SkeletonBlock v-for="i in 5" :key="i" class="h-20 rounded-2xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="NotebookPen"
            :title="t('debtBook.emptyTitle')"
            :text="t('debtBook.emptyText')"
          />
        </template>

        <div class="transition-opacity" :class="isFetching && !isLoading ? 'opacity-60' : ''">
          <!-- Desktop / tablet: table -->
          <Card class="hidden overflow-x-auto p-0 md:block">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left text-xs text-fg-muted">
                  <th class="px-4 py-3 font-semibold">{{ t('debtBook.borrowerName') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ t('debtBook.phone') }}</th>
                  <th class="px-4 py-3 text-right font-semibold">{{ t('debtBook.amount') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ t('debtBook.dueDate') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ t('debtBook.note') }}</th>
                  <th class="px-4 py-3 font-semibold">{{ t('debtBook.createdAt') }}</th>
                  <th class="px-4 py-3 text-right font-semibold">{{ t('debtBook.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="e in items"
                  :key="e.id"
                  class="border-b border-border last:border-0"
                  :class="dueStatus(e) === 'overdue' ? 'bg-danger-soft/40' : ''"
                >
                  <td class="max-w-48 truncate px-4 py-3 font-semibold text-fg" :title="e.borrowerName">
                    {{ e.borrowerName }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <a v-if="e.phone" :href="telHref(e.phone)" class="text-primary tnum hover:underline">
                      {{ formatPhone(e.phone) }}
                    </a>
                    <span v-else class="text-fg-muted">—</span>
                  </td>
                  <td class="px-4 py-3 text-right font-bold whitespace-nowrap text-fg tnum">
                    {{ formatMoney(e.amount) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <template v-if="dueStatus(e) === 'none'">
                      <span class="text-fg-muted">—</span>
                    </template>
                    <div v-else class="flex flex-col items-start gap-1">
                      <span
                        class="tnum"
                        :class="{
                          'font-semibold text-danger': dueStatus(e) === 'overdue',
                          'font-semibold text-warning': dueStatus(e) === 'today',
                        }"
                      >
                        {{ formatDate(e.dueDate) }}
                      </span>
                      <Badge v-if="dueStatus(e) === 'overdue'" tone="danger">
                        <AlertTriangle class="size-3" />{{ t('debtBook.overdue') }}
                      </Badge>
                      <Badge v-else-if="dueStatus(e) === 'today'" tone="warning">
                        {{ t('debtBook.dueToday') }}
                      </Badge>
                    </div>
                  </td>
                  <td class="max-w-56 px-4 py-3">
                    <p v-if="e.note" class="truncate text-fg-muted" :title="e.note">{{ e.note }}</p>
                    <span v-else class="text-fg-muted">—</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-fg-muted tnum">
                    {{ formatDate(e.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-1">
                      <button
                        class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                        :aria-label="t('app.edit')"
                        :title="t('app.edit')"
                        @click="edit(e)"
                      >
                        <Pencil class="size-4" />
                      </button>
                      <button
                        class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                        :aria-label="t('app.delete')"
                        :title="t('app.delete')"
                        @click="askDelete(e)"
                      >
                        <Trash2 class="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          <!-- Mobile: cards -->
          <div class="space-y-3 md:hidden">
            <Card
              v-for="e in items"
              :key="e.id"
              class="flex items-start gap-3"
              :class="dueStatus(e) === 'overdue' ? 'ring-1 ring-danger/30' : ''"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate font-semibold text-fg">{{ e.borrowerName }}</p>
                  <Badge v-if="dueStatus(e) === 'overdue'" tone="danger">
                    <AlertTriangle class="size-3" />{{ t('debtBook.overdue') }}
                  </Badge>
                  <Badge v-else-if="dueStatus(e) === 'today'" tone="warning">
                    {{ t('debtBook.dueToday') }}
                  </Badge>
                </div>

                <p class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-fg-muted">
                  <span>{{ t('debtBook.createdAt') }}: {{ formatDate(e.createdAt) }}</span>
                  <span
                    :class="{
                      'font-semibold text-danger': dueStatus(e) === 'overdue',
                      'font-semibold text-warning': dueStatus(e) === 'today',
                    }"
                  >
                    {{ t('debtBook.dueDate') }}: {{ formatDate(e.dueDate) }}
                  </span>
                </p>

                <a
                  v-if="e.phone"
                  :href="telHref(e.phone)"
                  class="mt-1 inline-flex items-center gap-1 text-xs text-primary tnum"
                >
                  <Phone class="size-3" />{{ formatPhone(e.phone) }}
                </a>
                <p v-if="e.note" class="mt-0.5 truncate text-xs text-fg-muted" :title="e.note">
                  {{ e.note }}
                </p>
              </div>

              <div class="flex shrink-0 flex-col items-end gap-2">
                <span class="font-bold text-fg tnum">{{ formatMoney(e.amount) }}</span>
                <div class="flex gap-1">
                  <button
                    class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                    :aria-label="t('app.edit')"
                    @click="edit(e)"
                  >
                    <Pencil class="size-4" />
                  </button>
                  <button
                    class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    :aria-label="t('app.delete')"
                    @click="askDelete(e)"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <AppPagination
          v-model="page"
          class="mt-4"
          :total-pages="totalPages"
          :disabled="isFetching"
        />
      </DataState>
    </PageContainer>

    <DebtBookFormSheet v-model="showForm" :entry="editing ?? undefined" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('debtBook.deleteConfirm', { name: deleting?.borrowerName ?? '' })"
      :confirm-label="t('app.delete')"
      danger
      :loading="deleteEntry.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
