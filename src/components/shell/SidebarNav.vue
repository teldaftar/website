<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Store, LogOut } from 'lucide-vue-next'
import { sidebarItems } from '@/config/nav'
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
      <div class="grid size-10 place-items-center rounded-xl bg-primary text-primary-fg">
        <Store class="size-5" />
      </div>
      <div class="min-w-0">
        <p class="truncate font-semibold text-fg">{{ auth.shop?.name ?? t('app.name') }}</p>
        <p class="truncate text-xs text-fg-muted">{{ auth.user?.fullName }}</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-3">
      <button
        v-for="item in sidebarItems"
        :key="item.name"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors"
        :class="
          isActive(item.name)
            ? 'bg-primary-soft text-primary'
            : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
        "
        @click="router.push({ name: item.name })"
      >
        <component :is="item.icon" class="size-5 shrink-0" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="border-t border-border p-3">
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-fg-muted transition-colors hover:bg-danger-soft hover:text-danger"
        @click="onLogout"
      >
        <LogOut class="size-5" />
        <span>{{ t('nav.logout') }}</span>
      </button>
    </div>
  </aside>
</template>
