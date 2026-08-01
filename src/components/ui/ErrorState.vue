<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { t } from '@/i18n'
import AppButton from './AppButton.vue'

defineProps<{ message?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="mb-4 grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger">
      <AlertTriangle class="size-8" />
    </div>
    <h3 class="text-base font-semibold text-fg">{{ t('app.error') }}</h3>
    <p v-if="message" class="mt-1 max-w-xs text-sm text-fg-muted">{{ message }}</p>
    <AppButton variant="secondary" size="sm" class="mt-5" @click="$emit('retry')">
      {{ t('app.retry') }}
    </AppButton>
  </div>
</template>
