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

// The left accent bar + icon tint give each tile its identity.
const barTone: Record<Tone, string> = {
  neutral: 'bg-border-strong',
  primary: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
}

const iconTone: Record<Tone, string> = {
  neutral: 'text-fg-muted',
  primary: 'text-primary',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
}
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 pl-5 shadow-card">
    <span class="absolute inset-y-0 left-0 w-1.5" :class="barTone[tone]" />
    <div class="flex items-start justify-between gap-2">
      <span class="eyebrow">{{ label }}</span>
      <component :is="icon" v-if="icon" :class="['size-4 shrink-0', iconTone[tone]]" />
    </div>
    <div class="mt-2.5 text-2xl leading-none font-bold tracking-tight text-fg tnum">
      {{ format === 'money' ? formatMoney(display) : formatNumber(display) }}
    </div>
    <p v-if="hint" class="mt-1.5 text-xs text-fg-muted">{{ hint }}</p>
  </div>
</template>
