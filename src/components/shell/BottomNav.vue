<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bottomTabs } from '@/config/nav'

const route = useRoute()
const router = useRouter()

/** Which bottom tab owns the current route (details stay under their section). */
const activeTab = computed(() => {
  const n = String(route.name ?? '')
  if (n.startsWith('phone')) return 'phones'
  if (n.startsWith('accessor')) return 'accessories'
  if (n === 'dashboard') return 'dashboard'
  if (n.startsWith('receipt')) return 'more'
  // Everything secondary (sales/debts/expenses/settings) groups under "More".
  if (['more', 'sales', 'sale-detail', 'debts', 'expenses', 'settings'].includes(n)) return 'more'
  return ''
})
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-safe backdrop-blur-lg lg:hidden"
    aria-label="Asosiy navigatsiya"
  >
    <div class="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-1">
      <button
        v-for="tab in bottomTabs"
        :key="tab.name"
        class="flex h-full flex-col items-center justify-center gap-0.5 text-fg-muted transition-colors"
        :class="activeTab === tab.name ? 'text-primary' : ''"
        @click="router.push({ name: tab.name })"
      >
        <component :is="tab.icon" class="size-6" :stroke-width="activeTab === tab.name ? 2.4 : 2" />
        <span class="text-[11px] font-medium">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
