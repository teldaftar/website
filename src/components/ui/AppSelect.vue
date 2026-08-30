<script setup lang="ts" generic="T extends string | number">
import { useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  label?: string
  error?: string
  disabled?: boolean
  options: { label: string; value: T }[]
  placeholder?: string
}>()

const model = defineModel<T | undefined>()
const id = useId()
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="eyebrow mb-2 block">
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="id"
        v-model="model"
        :disabled="disabled"
        :aria-invalid="!!error"
        :class="[
          'h-11 w-full appearance-none rounded-lg border bg-surface pl-3.5 pr-10 text-[15px] text-fg outline-none',
          'transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60',
          error ? 'border-danger' : 'border-border-strong',
        ]"
      >
        <option v-if="placeholder" :value="undefined" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
      />
    </div>
    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
  </div>
</template>
