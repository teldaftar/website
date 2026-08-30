<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Renders as a button-like tappable surface with hover/press feedback. */
    interactive?: boolean
    padded?: boolean
  }>(),
  { interactive: false, padded: true },
)
</script>

<template>
  <div
    :class="[
      'rounded-2xl border border-border bg-surface shadow-card',
      padded ? 'p-4' : '',
      interactive
        ? 'cursor-pointer transition-[transform,border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-pop active:scale-[.99]'
        : '',
    ]"
  >
    <slot />
  </div>
</template>
