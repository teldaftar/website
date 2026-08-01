<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    rows?: number
    disabled?: boolean
  }>(),
  { rows: 3, disabled: false },
)

const model = defineModel<string>()
const id = useId()
const describedBy = computed(() =>
  props.error ? `${id}-err` : props.hint ? `${id}-hint` : undefined,
)
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-fg-muted">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      :aria-describedby="describedBy"
      :class="[
        'w-full resize-y rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-fg outline-none',
        'placeholder:text-fg-muted/60 transition-colors',
        'focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60',
        error ? 'border-danger focus:ring-danger/25' : 'border-border',
      ]"
    />
    <p v-if="error" :id="`${id}-err`" class="mt-1 text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-fg-muted">{{ hint }}</p>
  </div>
</template>
