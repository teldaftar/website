<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Store, LogOut } from 'lucide-vue-next'
import { sidebarItems, newSaleItem } from '@/config/nav'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const currentName = computed(() => String(route.name ?? ''))

function isActive(name: string): boolean {
  const n = currentName.value
  if (name === 'phones') return n.startsWith('phone')
  if (name === 'accessories') return n.startsWith('accessor')
  if (name === 'receipts') return n.startsWith('receipt')
  if (name === 'sales') return n === 'sales' || n === 'sale-detail'
  return n === name
}

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <aside
    class="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex lg:sticky lg:top-0 lg:h-dvh"
  >
    <!-- Shop identity -->
    <div class="flex items-center gap-3 px-5 py-5">
      <div class="grid size-10 place-items-center rounded-lg bg-primary text-primary-fg">
        <Store class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="truncate font-semibold text-fg">{{ auth.shop?.name ?? t('app.name') }}</p>
        <p class="truncate text-xs text-fg-muted">{{ auth.user?.fullName }}</p>
      </div>
    </div>

    <!-- Primary action: New sale -->
    <div class="px-3 pb-2">
      <button
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-[15px] font-semibold text-primary-fg shadow-card transition-[background-color,transform] hover:bg-primary-hover active:scale-[.985]"
        @click="router.push({ name: newSaleItem.name })"
      >
        <component :is="newSaleItem.icon" class="size-5" />
        <span>{{ newSaleItem.label }}</span>
      </button>
    </div>

    <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
      <button
        v-for="item in sidebarItems"
        :key="item.name"
        class="relative flex w-full items-center gap-3 rounded-lg py-2.5 pr-3 pl-4 text-[15px] font-medium transition-colors"
        :class="
          isActive(item.name)
            ? 'bg-primary-soft text-primary'
            : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
        "
        @click="router.push({ name: item.name })"
      >
        <span
          v-if="isActive(item.name)"
          class="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary"
        />
        <component :is="item.icon" class="size-5 shrink-0" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="border-t border-border p-3">
      <button
        class="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[15px] font-medium text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
        @click="onLogout"
      >
        <LogOut class="size-5" />
        <span>{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>
