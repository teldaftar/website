<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label?: string; error?: string; min?: string; max?: string }>()
const model = defineModel<string>()
const id = useId()
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="eyebrow mb-2 block">
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      type="date"
      :min="min"
      :max="max"
      :aria-invalid="!!error"
      class="block h-11 w-full min-w-0 max-w-full appearance-none rounded-lg border bg-surface px-3.5 text-[15px] text-fg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 [color-scheme:light] dark:[color-scheme:dark]"
      :class="error ? 'border-danger' : 'border-border-strong'"
    />
    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
  </div>
</template>
