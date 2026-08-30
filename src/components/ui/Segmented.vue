<script setup lang="ts" generic="T extends string | number">
defineProps<{ options: { label: string; value: T }[] }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="inline-flex w-full rounded-lg border border-border bg-surface-2 p-1">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors"
      :class="
        model === opt.value
          ? 'bg-surface text-primary shadow-card'
          : 'text-fg-muted hover:text-fg'
      "
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
