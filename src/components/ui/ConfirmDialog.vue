<script setup lang="ts">
import { t } from '@/i18n'
import ModalSheet from './ModalSheet.vue'
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  { danger: false, loading: false },
)

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <ModalSheet v-model="open" bare>
    <div class="pt-2 text-center">
      <h2 class="text-lg font-bold text-fg">{{ title }}</h2>
      <p v-if="message" class="mt-2 text-sm text-fg-muted">{{ message }}</p>
      <div class="mt-6 flex gap-3">
        <AppButton variant="secondary" block :disabled="loading" @click="open = false">
          {{ cancelLabel ?? t('app.cancel') }}
        </AppButton>
        <AppButton
          :variant="danger ? 'danger' : 'primary'"
          block
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel ?? t('app.confirm') }}
        </AppButton>
      </div>
    </div>
  </ModalSheet>
</template>
