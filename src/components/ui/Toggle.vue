<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label?: string }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    class="inline-flex h-6.5 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors"
    :class="model ? 'bg-primary' : 'bg-surface-2'"
    @click="model = !model"
  >
    <span
      class="size-5 rounded-full bg-white shadow-sm transition-transform"
      :class="model ? 'translate-x-4.5' : 'translate-x-0'"
    />
  </button>
</template>
