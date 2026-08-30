<script setup lang="ts">
import type { Tone } from '@/lib/labels'

withDefaults(defineProps<{ tone?: Tone; dot?: boolean }>(), { tone: 'neutral', dot: false })

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
      toneClasses[tone],
    ]"
  >
    <span v-if="dot" class="size-1.5 rounded-full bg-current" />
    <slot />
  </span>
</template>
