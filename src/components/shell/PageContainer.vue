<script setup lang="ts">
withDefaults(defineProps<{ wide?: boolean }>(), { wide: false })
</script>

<template>
  <div
    class="mx-auto w-full px-4 pt-4 pb-28 lg:px-8 lg:pt-4 lg:pb-10"
    :class="wide ? 'max-w-5xl' : 'max-w-2xl'"
  >
    <slot />
  </div>
</template>
