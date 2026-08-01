<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; back?: boolean; subtitle?: string }>(), {
  back: false,
})

const router = useRouter()
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/85 px-3 pt-safe backdrop-blur-lg lg:static lg:h-auto lg:border-0 lg:bg-transparent lg:px-8 lg:pt-6 lg:pb-2 lg:backdrop-blur-none"
  >
    <button
      v-if="back"
      class="-ml-1 grid size-10 shrink-0 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label="Orqaga"
      @click="router.back()"
    >
      <ChevronLeft class="size-6" />
    </button>
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-lg font-bold text-fg lg:text-2xl">{{ title }}</h1>
      <p v-if="subtitle" class="truncate text-xs text-fg-muted lg:text-sm">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
