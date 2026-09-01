<script setup lang="ts">
// Sticky day-separator shown above each calendar-day bucket of a grouped list
// (see `groupByDay` in lib/format). `count` is optional — the number of items
// in the day, rendered as a subtle trailing badge.
defineProps<{ label: string; count?: number }>()
</script>

<template>
  <div class="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-bg/85 px-1 py-2 backdrop-blur">
    <span class="text-sm font-semibold text-fg">{{ label }}</span>
    <span class="h-px flex-1 bg-border" />
    <span v-if="count != null" class="text-xs font-medium text-fg-muted">{{ count }} ta</span>
  </div>
</template>
