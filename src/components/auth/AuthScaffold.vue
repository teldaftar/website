<script setup lang="ts">
import { Store } from 'lucide-vue-next'
import { t } from '@/i18n'

defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
    <div v-motion-fade-visible class="w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center text-center">
        <div
          class="mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/25"
        >
          <Store class="size-7" />
        </div>
        <h1 class="text-2xl font-bold text-fg">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-fg-muted">{{ subtitle }}</p>
      </div>

      <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <slot />
      </div>

      <p class="mt-6 text-center text-xs text-fg-muted">{{ t('app.name') }} · UZS</p>
    </div>
  </div>
</template>
