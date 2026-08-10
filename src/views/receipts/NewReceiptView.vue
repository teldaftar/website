<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, PackagePlus } from 'lucide-vue-next'
import type { Accessory, CreateStockReceiptPayload, NewAccessoryInput } from '@/api/types'
import {
  useCreateStockReceipt,
  useUpdateStockReceipt,
  useStockReceipt,
} from '@/composables/useStockReceipts'
import { toUserMessage } from '@/api/errors'
import { formatMoney, formatNumber } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ReceiptRowCard from '@/components/receipts/ReceiptRowCard.vue'
import ReceiptItemPicker from '@/components/receipts/ReceiptItemPicker.vue'
import {
  rowComplete,
  rowFromAccessory,
  rowFromNew,
  rowFromReceiptItem,
  rowQty,
  rowSubtotal,
  toPayloadLine,
  type ReceiptRowState,
} from '@/components/receipts/receiptLine'

const route = useRoute()
const router = useRouter()
const createReceipt = useCreateStockReceipt()
const updateReceipt = useUpdateStockReceipt()

const editId = computed(() => (route.name === 'receipt-edit' ? String(route.params.id) : null))
const isEdit = computed(() => editId.value != null)

let keySeq = 1
const rows = reactive<ReceiptRowState[]>([])
const showPicker = ref(false)
const submitting = ref(false)

// Edit mode: fetch the receipt and prefill the table once.
const { data: existing, isLoading: loadingReceipt } = useStockReceipt(
  computed(() => editId.value ?? ''),
  { enabled: isEdit },
)
let prefilled = false
watch(
  existing,
  (r) => {
    if (!r || prefilled) return
    prefilled = true
    rows.splice(0, rows.length, ...r.items.map((item) => rowFromReceiptItem(keySeq++, item)))
  },
  { immediate: true },
)

const totalQty = computed(() => rows.reduce((sum, r) => sum + rowQty(r), 0))
const totalAmount = computed(() => rows.reduce((sum, r) => sum + rowSubtotal(r), 0))

// Save is enabled only when every row mirrors the server rules (instant feedback).
const canSave = computed(() => rows.length > 0 && rows.every(rowComplete))

// Existing accessory ids already in the table — the picker disables these.
const addedIds = computed(() =>
  rows.filter((r) => r.accessoryId).map((r) => r.accessoryId as string),
)

function onAdd(picked: { existing: Accessory[]; created: NewAccessoryInput[] }) {
  const already = new Set(addedIds.value)
  for (const acc of picked.existing) {
    if (already.has(acc.id)) continue
    rows.push(rowFromAccessory(keySeq++, acc))
    already.add(acc.id)
  }
  for (const input of picked.created) {
    rows.push(rowFromNew(keySeq++, input))
  }
}

function removeRow(index: number) {
  rows.splice(index, 1)
}

async function onSubmit() {
  if (!canSave.value || submitting.value) return

  const payload: CreateStockReceiptPayload = { items: rows.map(toPayloadLine) }

  submitting.value = true
  try {
    const id = editId.value
    const saved = id
      ? await updateReceipt.mutateAsync({ id, payload })
      : await createReceipt.mutateAsync(payload)
    notify.success(isEdit.value ? t('settings.saved') : t('receipts.saved'))
    router.replace({ name: 'receipt-detail', params: { id: saved.id } })
  } catch (err) {
    // Covers INSUFFICIENT_STOCK (PATCH sends details.minQuantity — sold-stock protection).
    notify.error(toUserMessage(err))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader :title="isEdit ? t('receipts.editTitle') : t('receipts.new')" back />

    <PageContainer wide>
      <!-- Loading the receipt to edit -->
      <div v-if="isEdit && loadingReceipt && rows.length === 0" class="space-y-3">
        <SkeletonBlock v-for="i in 3" :key="i" class="h-40 rounded-2xl" />
      </div>

      <div v-else class="space-y-4 pb-4">
        <!-- Empty: a single, calm call-to-action -->
        <EmptyState
          v-if="rows.length === 0"
          :icon="PackagePlus"
          :title="t('receipts.emptyItemsTitle')"
          :text="t('receipts.emptyItemsText')"
        >
          <template #action>
            <AppButton @click="showPicker = true">
              <template #icon><Plus class="size-4" /></template>
              {{ t('receipts.addItem') }}
            </AppButton>
          </template>
        </EmptyState>

        <!-- Non-empty: the table + a light dashed "add more" tile -->
        <template v-else>
          <TransitionGroup tag="div" name="list" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ReceiptRowCard
              v-for="(row, i) in rows"
              :key="row.key"
              v-model="rows[i]!"
              @remove="removeRow(i)"
            />
          </TransitionGroup>

          <button
            type="button"
            class="group flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border py-3.5 font-medium text-fg-muted transition-colors hover:border-primary hover:bg-primary-soft/30 hover:text-primary"
            @click="showPicker = true"
          >
            <span
              class="grid size-7 place-items-center rounded-full bg-surface-2 text-fg-muted transition-colors group-hover:bg-primary group-hover:text-primary-fg"
            >
              <Plus class="size-4.5" />
            </span>
            {{ t('receipts.addItem') }}
          </button>

          <!-- Running total -->
          <div class="rounded-2xl border border-border bg-surface p-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-fg-muted">{{ t('receipts.sumQty') }}</span>
              <span class="font-semibold text-fg tnum">
                {{ formatNumber(totalQty) }} {{ t('accessories.unit') }}
              </span>
            </div>
            <div class="mt-1.5 flex items-center justify-between">
              <span class="font-medium text-fg">{{ t('receipts.sumAmount') }}</span>
              <span class="text-lg font-bold text-primary tnum">
                {{ formatMoney(totalAmount) }}
              </span>
            </div>
          </div>

          <div class="flex gap-3">
            <AppButton type="button" variant="secondary" block @click="router.back()">
              {{ t('app.cancel') }}
            </AppButton>
            <AppButton
              type="button"
              block
              :disabled="!canSave"
              :loading="submitting"
              @click="onSubmit"
            >
              {{ t('app.save') }}
            </AppButton>
          </div>
        </template>
      </div>
    </PageContainer>

    <ReceiptItemPicker v-model="showPicker" :added-ids="addedIds" @add="onAdd" />
  </div>
</template>
