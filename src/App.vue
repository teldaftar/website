<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useUiStore } from '@/stores/ui'
import { useAppUpdate } from '@/composables/useAppUpdate'
import RouteProgress from '@/components/shell/RouteProgress.vue'
import UpdateModal from '@/components/shell/UpdateModal.vue'

// Apply the persisted theme on mount (the inline <head> script handles first paint).
useUiStore().apply()

// Prompt the user to reload when a newer build has been deployed.
const { updateAvailable, reload } = useAppUpdate()
const updateDismissed = ref(false)
</script>

<template>
  <RouteProgress />

  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>

  <UpdateModal
    :open="updateAvailable && !updateDismissed"
    @reload="reload"
    @dismiss="updateDismissed = true"
  />

  <Toaster
    position="top-center"
    rich-colors
    close-button
    expand
    :offset="14"
    :duration="3500"
    :toast-options="{
      style: { fontFamily: 'inherit', fontWeight: '500', borderRadius: '0.625rem' },
    }"
  />
</template>
