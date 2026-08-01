<script setup lang="ts">
import ErrorState from './ErrorState.vue'

/**
 * Wraps a data region with the mandatory loading / empty / error states.
 * Pass a `skeleton` slot for the loading look and an `empty` slot for the
 * empty look; `default` renders when there's data.
 */
defineProps<{
  loading: boolean
  isError: boolean
  isEmpty: boolean
  errorMessage?: string
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <div>
    <slot v-if="loading" name="skeleton" />
    <ErrorState v-else-if="isError" :message="errorMessage" @retry="$emit('retry')" />
    <slot v-else-if="isEmpty" name="empty" />
    <slot v-else />
  </div>
</template>
