<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useUiStore } from '@/stores/ui'

// Apply the persisted theme on mount (the inline <head> script handles first paint).
useUiStore().apply()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>

  <Toaster
    position="top-center"
    rich-colors
    close-button
    :duration="3000"
    :toast-options="{ style: { fontFamily: 'inherit' } }"
  />
</template>
