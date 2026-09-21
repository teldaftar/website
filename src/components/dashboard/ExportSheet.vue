<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { endOfMonth, format, parseISO } from 'date-fns'
import { Check, Download, Headphones, LayoutGrid, Phone, Smartphone } from 'lucide-vue-next'
import type { Component } from 'vue'
import { statisticsApi } from '@/api/statistics'
import type { StatExportScope } from '@/api/types'
import { toUserMessage } from '@/api/errors'
import { saveBlob } from '@/lib/download'
import { formatDate, todayISO } from '@/lib/format'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const open = defineModel<boolean>({ required: true })

/** How many years back the year picker offers. */
const YEARS_BACK = 4

const today = parseISO(todayISO())
const month = ref(today.getMonth() + 1)
const year = ref(today.getFullYear())
const scope = ref<StatExportScope>('ALL')
const busy = ref(false)

// Always reopen on the current month — the common case is "this month's report".
watch(open, (isOpen) => {
  if (!isOpen) return
  month.value = today.getMonth() + 1
  year.value = today.getFullYear()
  scope.value = 'ALL'
})

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: t(`export.months.${i + 1}`),
}))

const yearOptions = Array.from({ length: YEARS_BACK + 1 }, (_, i) => {
  const y = today.getFullYear() - i
  return { value: y, label: String(y) }
})

/** The picked month as the backend's inclusive shop-local date range. */
const range = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  return {
    from: format(first, 'yyyy-MM-dd'),
    to: format(endOfMonth(first), 'yyyy-MM-dd'),
  }
})

const scopes: { value: StatExportScope; label: string; hint: string; icon: Component }[] = [
  {
    value: 'ALL',
    label: t('export.scopeAll'),
    hint: t('export.scopeAllHint'),
    icon: LayoutGrid,
  },
  {
    value: 'PHONE',
    label: t('export.scopePhones'),
    hint: t('export.scopePhonesHint'),
    icon: Smartphone,
  },
  {
    value: 'ACCESSORY',
    label: t('export.scopeAccessories'),
    hint: t('export.scopeAccessoriesHint'),
    icon: Headphones,
  },
  {
    value: 'KEYPAD_PHONE',
    label: t('export.scopeKeypad'),
    hint: t('export.scopeKeypadHint'),
    icon: Phone,
  },
]

async function download() {
  busy.value = true
  try {
    const file = await statisticsApi.exportXlsx({ ...range.value, scope: scope.value })
    saveBlob(file.blob, file.filename)
    notify.success(t('export.success'), file.filename)
    open.value = false
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('export.title')">
    <div class="space-y-4">
      <p class="text-sm text-fg-muted">{{ t('export.subtitle') }}</p>

      <div class="grid grid-cols-2 gap-3">
        <AppSelect v-model="month" :label="t('export.month')" :options="monthOptions" />
        <AppSelect v-model="year" :label="t('export.year')" :options="yearOptions" />
      </div>

      <div class="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm">
        <span class="text-fg-muted">{{ t('export.period') }}: </span>
        <span class="font-semibold text-fg tnum">
          {{ formatDate(range.from) }} — {{ formatDate(range.to) }}
        </span>
      </div>

      <div>
        <p class="eyebrow mb-2">{{ t('export.scope') }}</p>
        <div class="space-y-2">
          <button
            v-for="opt in scopes"
            :key="opt.value"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors"
            :class="
              scope === opt.value
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface hover:bg-surface-2'
            "
            :aria-pressed="scope === opt.value"
            @click="scope = opt.value"
          >
            <span
              class="grid size-9 shrink-0 place-items-center rounded-lg"
              :class="
                scope === opt.value ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-fg-muted'
              "
            >
              <component :is="opt.icon" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-fg">{{ opt.label }}</span>
              <span class="block truncate text-xs text-fg-muted">{{ opt.hint }}</span>
            </span>
            <Check v-if="scope === opt.value" class="size-5 shrink-0 text-primary" />
          </button>
        </div>
      </div>

      <p class="text-xs text-fg-muted">{{ t('export.sheetsHint') }}</p>

      <AppButton block size="lg" :loading="busy" @click="download">
        <template #icon><Download class="size-5" /></template>
        {{ busy ? t('export.preparing') : t('export.download') }}
      </AppButton>
    </div>
  </ModalSheet>
</template>
