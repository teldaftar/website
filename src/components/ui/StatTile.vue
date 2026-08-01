<script setup lang="ts">
import type { Component } from 'vue'
import type { Tone } from '@/lib/labels'
import { useCountUp } from '@/composables/useCountUp'
import { formatMoney, formatNumber } from '@/lib/format'
import { toRef } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    /** money → formats with so'm suffix; number → grouped integer. */
    format?: 'money' | 'number'
    icon?: Component
    tone?: Tone
    hint?: string
  }>(),
  { format: 'money', tone: 'neutral', icon: undefined },
)

const display = useCountUp(toRef(props, 'value'))

const iconTone: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
}
</script>

<template>
  <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[.03]">
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm text-fg-muted">{{ label }}</span>
      <span
        v-if="icon"
        :class="['grid size-8 shrink-0 place-items-center rounded-lg', iconTone[tone]]"
      >
        <component :is="icon" class="size-4" />
      </span>
    </div>
    <div class="mt-2 text-xl font-bold tracking-tight text-fg tnum">
      {{ format === 'money' ? formatMoney(display) : formatNumber(display) }}
    </div>
    <p v-if="hint" class="mt-0.5 text-xs text-fg-muted">{{ hint }}</p>
  </div>
</template>
