<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight, LogOut, Moon, Sun } from 'lucide-vue-next'
import { moreItems } from '@/config/nav'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import Card from '@/components/ui/Card.vue'

const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div>
    <PageHeader :title="t('nav.more')" />
    <PageContainer>
      <div class="space-y-3">
        <Card :padded="false" class="overflow-hidden">
          <button
            v-for="(item, i) in moreItems"
            :key="item.name"
            class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
            :class="i > 0 ? 'border-t border-border' : ''"
            @click="router.push({ name: item.name })"
          >
            <span class="grid size-9 place-items-center rounded-lg bg-surface-2 text-fg-muted">
              <component :is="item.icon" class="size-5" />
            </span>
            <span class="flex-1 font-medium text-fg">{{ item.label }}</span>
            <ChevronRight class="size-5 text-fg-muted" />
          </button>
        </Card>

        <Card :padded="false" class="overflow-hidden">
          <button
            class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
            @click="ui.toggleDark()"
          >
            <span class="grid size-9 place-items-center rounded-lg bg-surface-2 text-fg-muted">
              <component :is="ui.isDark() ? Sun : Moon" class="size-5" />
            </span>
            <span class="flex-1 font-medium text-fg">{{ t('settings.darkMode') }}</span>
            <span class="text-sm text-fg-muted">{{ ui.isDark() ? 'Yoniq' : "O'chiq" }}</span>
          </button>
        </Card>

        <Card :padded="false" class="overflow-hidden">
          <button
            class="flex w-full items-center gap-3 px-4 py-3.5 text-left text-danger transition-colors hover:bg-danger-soft"
            @click="onLogout"
          >
            <span class="grid size-9 place-items-center rounded-lg bg-danger-soft">
              <LogOut class="size-5" />
            </span>
            <span class="flex-1 font-medium">{{ t('nav.logout') }}</span>
          </button>
        </Card>
      </div>
    </PageContainer>
  </div>
</template>
