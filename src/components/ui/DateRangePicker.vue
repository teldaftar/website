<script setup lang="ts">
import { ref } from 'vue'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, format } from 'date-fns'
import { todayISO } from '@/lib/format'
import { t } from '@/i18n'
import AppDateInput from './AppDateInput.vue'

export interface DateRange {
  from: string
  to: string
}

const model = defineModel<DateRange>({ required: true })

type Preset = 'today' | 'week' | 'month' | 'custom'
const active = ref<Preset>('month')

function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function apply(preset: Preset) {
  active.value = preset
  const today = parseISO(todayISO())
  if (preset === 'today') {
    model.value = { from: todayISO(), to: todayISO() }
  } else if (preset === 'week') {
    model.value = {
      from: fmt(startOfWeek(today, { weekStartsOn: 1 })),
      to: fmt(endOfWeek(today, { weekStartsOn: 1 })),
    }
  } else if (preset === 'month') {
    model.value = { from: fmt(startOfMonth(today)), to: fmt(endOfMonth(today)) }
  }
}

const presets: { key: Preset; label: string }[] = [
  { key: 'today', label: t('dashboard.presetToday') },
  { key: 'week', label: t('dashboard.presetWeek') },
  { key: 'month', label: t('dashboard.presetMonth') },
  { key: 'custom', label: t('dashboard.presetCustom') },
]
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="p in presets"
        :key="p.key"
        type="button"
        class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
        :class="
          active === p.key
            ? 'border-primary bg-primary text-primary-fg'
            : 'border-border bg-surface text-fg-muted hover:text-fg'
        "
        @click="apply(p.key)"
      >
        {{ p.label }}
      </button>
    </div>

    <div v-if="active === 'custom'" class="grid grid-cols-2 gap-3">
      <AppDateInput v-model="model.from" :max="model.to" />
      <AppDateInput v-model="model.to" :min="model.from" />
    </div>
  </div>
</template>
