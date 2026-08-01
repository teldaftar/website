<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'search'
    autocomplete?: string
  }>(),
  { type: 'text', disabled: false },
)

const model = defineModel<string | number>()
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
    <div class="relative flex items-center">
      <span v-if="$slots.prefix" class="pointer-events-none absolute left-3 text-fg-muted">
        <slot name="prefix" />
      </span>
      <input
        :id="id"
        v-model="model"
        :type="type"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
        :class="[
          'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-fg outline-none',
          'placeholder:text-fg-muted/60 transition-colors',
          'focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60',
          error ? 'border-danger focus:border-danger focus:ring-danger/25' : 'border-border',
          $slots.prefix ? 'pl-9' : '',
          $slots.suffix ? 'pr-10' : '',
        ]"
      />
      <span v-if="$slots.suffix" class="absolute right-3 text-fg-muted">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" :id="`${id}-err`" class="mt-1 text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-fg-muted">{{ hint }}</p>
  </div>
</template>
