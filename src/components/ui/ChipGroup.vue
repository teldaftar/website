<script setup lang="ts" generic="T extends string | number">
import { t } from '@/i18n'

withDefaults(
  defineProps<{
    options: { label: string; value: T }[]
    /** Show an "all" chip that clears the selection (model = undefined). */
    allowAll?: boolean
    allLabel?: string
  }>(),
  { allowAll: true },
)

const model = defineModel<T | undefined>()

function chipClass(active: boolean): string {
  return active
    ? 'bg-primary text-primary-fg border-primary'
    : 'bg-surface text-fg-muted border-border hover:text-fg'
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-if="allowAll"
      type="button"
      class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
      :class="chipClass(model === undefined)"
      @click="model = undefined"
    >
      {{ allLabel ?? t('app.all') }}
    </button>
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
      :class="chipClass(model === opt.value)"
      @click="model = model === opt.value ? undefined : opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
