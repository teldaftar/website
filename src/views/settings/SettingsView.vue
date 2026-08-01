<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, KeyRound, User } from 'lucide-vue-next'
import { shopApi } from '@/api/shop'
import { useAuthStore } from '@/stores/auth'
import { useUiStore, type ThemePref } from '@/stores/ui'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import Card from '@/components/ui/Card.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Segmented from '@/components/ui/Segmented.vue'
import ChangePasswordSheet from '@/components/settings/ChangePasswordSheet.vue'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const form = reactive({
  name: auth.shop?.name ?? '',
  address: auth.shop?.address ?? '',
  phone: auth.shop?.phone ?? '',
  labelFooter: auth.shop?.labelFooter ?? '',
})
const savingShop = ref(false)
const showChangePassword = ref(false)

async function saveShop() {
  savingShop.value = true
  try {
    const shop = await shopApi.update({
      name: form.name.trim(),
      address: form.address || undefined,
      phone: form.phone || undefined,
      labelFooter: form.labelFooter || undefined,
    })
    auth.setShop(shop)
    notify.success(t('settings.saved'))
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    savingShop.value = false
  }
}

const themeOptions: { label: string; value: ThemePref }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'system' },
]
function setTheme(v: ThemePref) {
  ui.setTheme(v)
}

async function onLogout() {
  await auth.logout()
  router.replace({ name: 'login' })
}

const appVersion = '1.0.0'
</script>

<template>
  <div>
    <PageHeader :title="t('settings.title')" back />
    <PageContainer>
      <div class="space-y-6">
        <!-- Shop profile -->
        <section>
          <h2 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
            {{ t('settings.shopProfile') }}
          </h2>
          <Card class="space-y-4">
            <AppInput v-model="form.name" :label="t('settings.shopNameField')" />
            <AppInput v-model="form.address" :label="t('settings.address')" />
            <AppInput v-model="form.phone" :label="t('settings.phone')" inputmode="tel" />
            <AppInput v-model="form.labelFooter" :label="t('settings.labelFooter')" />

            <!-- Live label preview -->
            <div>
              <p class="mb-1.5 text-sm font-medium text-fg-muted">
                {{ t('settings.labelPreview') }}
              </p>
              <div
                class="mx-auto w-56 rounded-xl border border-dashed border-border bg-white p-3 text-center text-black"
              >
                <p class="text-sm font-extrabold uppercase">{{ form.name || '—' }}</p>
                <div class="my-1.5 border-t border-dashed border-black/30" />
                <p class="text-[15px] font-bold">iPhone 15 Pro</p>
                <p class="text-[12px]">8 GB / 256 GB</p>
                <div class="my-1.5 border-t border-dashed border-black/30" />
                <p class="font-mono text-[12px]">123456789012345</p>
                <p v-if="form.labelFooter" class="mt-1.5 text-[10px] text-black/70">
                  {{ form.labelFooter }}
                </p>
              </div>
            </div>

            <AppButton block :loading="savingShop" @click="saveShop">{{ t('app.save') }}</AppButton>
          </Card>
        </section>

        <!-- Appearance -->
        <section>
          <h2 class="mb-2 px-1 text-sm font-semibold text-fg-muted">
            {{ t('settings.appearance') }}
          </h2>
          <Card class="space-y-3">
            <div>
              <p class="mb-2 text-sm font-medium text-fg">{{ t('settings.darkMode') }}</p>
              <Segmented
                :model-value="ui.theme"
                :options="themeOptions"
                @update:model-value="setTheme"
              />
            </div>
            <p class="text-xs text-fg-muted">{{ t('settings.reducedMotionNote') }}</p>
          </Card>
        </section>

        <!-- Account -->
        <section>
          <h2 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('settings.account') }}</h2>
          <Card :padded="false" class="overflow-hidden">
            <div class="flex items-center gap-3 px-4 py-3.5">
              <div
                class="grid size-10 place-items-center rounded-full bg-primary-soft text-primary"
              >
                <User class="size-5" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium text-fg">{{ auth.user?.fullName }}</p>
                <p class="truncate text-xs text-fg-muted">{{ auth.user?.login }}</p>
              </div>
            </div>
            <button
              class="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              @click="showChangePassword = true"
            >
              <KeyRound class="size-5 text-fg-muted" />
              <span class="flex-1 font-medium text-fg">{{ t('auth.changePassword') }}</span>
            </button>
            <button
              class="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left text-danger transition-colors hover:bg-danger-soft"
              @click="onLogout"
            >
              <LogOut class="size-5" />
              <span class="flex-1 font-medium">{{ t('nav.logout') }}</span>
            </button>
          </Card>
        </section>

        <!-- About -->
        <section>
          <h2 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('settings.about') }}</h2>
          <Card class="flex items-center justify-between">
            <span class="text-sm text-fg-muted">{{ t('settings.version') }}</span>
            <span class="text-sm font-medium text-fg tnum">{{ appVersion }}</span>
          </Card>
        </section>
      </div>
    </PageContainer>

    <ChangePasswordSheet v-model="showChangePassword" />
  </div>
</template>
