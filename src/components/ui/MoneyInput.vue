<script setup lang="ts">
import { ref, watch, useId } from 'vue'
import { formatNumber } from '@/lib/format'

withDefaults(
  defineProps<{
    label?: string
    error?: string
    hint?: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

/** Numeric model in whole so'm; null when empty. */
const model = defineModel<number | null>()
const id = useId()
const display = ref(model.value != null ? formatNumber(model.value) : '')

watch(model, (v) => {
  const parsed = display.value.replace(/\D/g, '')
  // Keep the field in sync when the model changes from outside (reset/edit).
  if (v == null && display.value !== '') display.value = ''
  else if (v != null && String(v) !== parsed) display.value = formatNumber(v)
})

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  if (raw === '') {
    display.value = ''
    model.value = null
    return
  }
  const n = Number(raw)
  display.value = formatNumber(n)
  model.value = n
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-fg-muted">
      {{ label }}
    </label>
    <div class="relative flex items-center">
      <input
        :id="id"
        :value="display"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder ?? '0'"
        :disabled="disabled"
        :aria-invalid="!!error"
        class="h-11 w-full rounded-xl border bg-surface pr-14 pl-3.5 text-[15px] font-medium text-fg tabular-nums outline-none transition-colors placeholder:text-fg-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
        :class="error ? 'border-danger focus:ring-danger/25' : 'border-border'"
        @input="onInput"
      />
      <span class="pointer-events-none absolute right-3.5 text-sm text-fg-muted">so'm</span>
    </div>
    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-sm text-fg-muted">{{ hint }}</p>
  </div>
</template>
