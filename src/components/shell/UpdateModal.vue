<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { t } from '@/i18n'
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ reload: []; dismiss: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="open" class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
    </Transition>

    <Transition name="dialog">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-[60] p-4 lg:inset-0 lg:grid lg:place-items-center"
        role="dialog"
        aria-modal="true"
        :aria-label="t('update.title')"
      >
        <div
          class="mx-auto w-full max-w-sm rounded-3xl border border-border bg-surface p-6 pb-safe shadow-2xl lg:pb-6"
        >
          <div class="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <RefreshCw class="size-6" />
          </div>

          <h2 class="mt-4 text-lg font-bold text-fg">{{ t('update.title') }}</h2>
          <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">{{ t('update.message') }}</p>

          <div class="mt-5 flex gap-2.5">
            <AppButton variant="secondary" block @click="emit('dismiss')">
              {{ t('update.later') }}
            </AppButton>
            <AppButton block @click="emit('reload')">
              {{ t('update.reload') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
