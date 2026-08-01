<script setup lang="ts" generic="T extends string | number">
defineProps<{ options: { label: string; value: T }[] }>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="inline-flex w-full rounded-xl bg-surface-2 p-1">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      :class="model === opt.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
