<script setup lang="ts">
withDefaults(defineProps<{ rounded?: string }>(), { rounded: 'rounded-lg' })
</script>

<template>
  <div :class="['animate-pulse bg-surface-2', rounded]" />
</template>
