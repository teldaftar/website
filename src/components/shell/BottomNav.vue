<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bottomTabs, newSaleItem } from '@/config/nav'

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

const saleActive = computed(() => String(route.name ?? '') === 'sale-new')

// Two tabs on each side of the raised center action.
const leftTabs = computed(() => bottomTabs.slice(0, 2))
const rightTabs = computed(() => bottomTabs.slice(2))
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg lg:hidden"
    aria-label="Asosiy navigatsiya"
  >
    <div class="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
      <button
        v-for="tab in leftTabs"
        :key="tab.name"
        class="flex h-full flex-col items-center justify-center gap-0.5 transition-colors"
        :class="activeTab === tab.name ? 'text-primary' : 'text-fg-muted'"
        @click="router.push({ name: tab.name })"
      >
        <component :is="tab.icon" class="size-6" :stroke-width="activeTab === tab.name ? 2.4 : 2" />
        <span class="text-[11px] font-medium">{{ tab.label }}</span>
      </button>

      <!-- Center raised action: new sale -->
      <div class="flex items-start justify-center">
        <button
          class="-mt-6 flex size-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-4 border-bg text-primary-fg shadow-pop transition-transform active:scale-95"
          :class="saleActive ? 'bg-primary-hover' : 'bg-primary'"
          :aria-label="newSaleItem.label"
          @click="router.push({ name: newSaleItem.name })"
        >
          <component :is="newSaleItem.icon" class="size-6" :stroke-width="2.2" />
        </button>
      </div>

      <button
        v-for="tab in rightTabs"
        :key="tab.name"
        class="flex h-full flex-col items-center justify-center gap-0.5 transition-colors"
        :class="activeTab === tab.name ? 'text-primary' : 'text-fg-muted'"
        @click="router.push({ name: tab.name })"
      >
        <component :is="tab.icon" class="size-6" :stroke-width="activeTab === tab.name ? 2.4 : 2" />
        <span class="text-[11px] font-medium">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
