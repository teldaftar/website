<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const ui = useUiStore()
const auth = useAuthStore()
</script>

<template>
  <header
    class="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur lg:flex"
  >
    <h1 class="text-lg font-semibold text-fg">{{ auth.shop?.name }}</h1>
    <div class="flex items-center gap-3">
      <button
        class="grid size-10 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        :aria-label="ui.isDark() ? 'Light' : 'Dark'"
        @click="ui.toggleDark()"
      >
        <Sun v-if="ui.isDark()" class="size-5" />
        <Moon v-else class="size-5" />
      </button>
      <div
        class="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
      >
        {{ (auth.user?.fullName ?? '?').charAt(0).toUpperCase() }}
      </div>
    </div>
  </header>
</template>
