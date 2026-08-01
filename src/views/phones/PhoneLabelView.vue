<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Printer } from 'lucide-vue-next'
import { usePhoneLabel, usePhone } from '@/composables/usePhones'
import { phoneCondition } from '@/lib/labels'
import { toUserMessage } from '@/api/errors'
import { t } from '@/i18n'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Segmented from '@/components/ui/Segmented.vue'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: label, isLoading, isError, error, refetch } = usePhoneLabel(id)
// Fetch the phone too, so RAM / storage can be shown separately with labels
// (the label endpoint only sends a combined `memory` string).
const { data: phone } = usePhone(id)

// Thermal paper width — frontend owns the layout; backend sends data only.
const width = ref<'58' | '80'>('58')
const widthOptions = [
  { label: '58 mm', value: '58' as const },
  { label: '80 mm', value: '80' as const },
]

const condition = computed(() =>
  label.value?.condition ? phoneCondition(label.value.condition).label : '',
)

/** Labelled spec rows — only the ones we actually have. */
const specs = computed(() => {
  const rows: { label: string; value: string; mono?: boolean }[] = []
  if (phone.value?.ramGb)
    rows.push({ label: t('phones.ramFull'), value: `${phone.value.ramGb} GB` })
  if (phone.value?.storageGb)
    rows.push({ label: t('phones.storageFull'), value: `${phone.value.storageGb} GB` })
  if (condition.value) rows.push({ label: t('phones.condition'), value: condition.value })
  if (label.value?.imei) rows.push({ label: t('phones.imei'), value: label.value.imei, mono: true })
  return rows
})

function print() {
  window.print()
}
</script>

<template>
  <div class="min-h-dvh bg-bg">
    <!-- On-screen chrome (never printed) -->
    <header
      class="no-print sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-surface/85 px-3 pt-safe backdrop-blur-lg"
    >
      <button
        class="-ml-1 grid size-10 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Orqaga"
        @click="router.back()"
      >
        <ChevronLeft class="size-6" />
      </button>
      <h1 class="flex-1 truncate text-lg font-bold text-fg">{{ t('phones.printLabel') }}</h1>
    </header>

    <div class="mx-auto max-w-md px-4 py-6">
      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="false"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <SkeletonBlock class="mx-auto h-72 w-64 rounded-2xl" />
        </template>

        <div v-if="label">
          <div class="no-print mb-4">
            <Segmented v-model="width" :options="widthOptions" />
          </div>

          <!-- The printable label -->
          <div class="flex justify-center">
            <div
              class="label-sheet rounded-xl border border-dashed border-border bg-white p-4 text-black shadow-sm"
              :style="{ width: width === '58' ? '58mm' : '80mm' }"
            >
              <p class="text-center text-[15px] font-extrabold tracking-tight uppercase">
                {{ label.shopName }}
              </p>
              <div class="my-2 border-t border-dashed border-black/30" />
              <p class="text-center text-[17px] leading-tight font-bold">{{ label.name }}</p>
              <div class="my-2 border-t border-dashed border-black/30" />

              <!-- Labelled specs -->
              <dl class="space-y-1">
                <div
                  v-for="row in specs"
                  :key="row.label"
                  class="flex items-baseline justify-between gap-2"
                >
                  <dt class="text-[11px] text-black/60">{{ row.label }}</dt>
                  <dd
                    class="text-right text-[13px] font-semibold"
                    :class="row.mono ? 'font-mono tracking-wider tabular-nums' : ''"
                  >
                    {{ row.value }}
                  </dd>
                </div>
              </dl>

              <template v-if="label.labelFooter">
                <div class="my-2 border-t border-dashed border-black/30" />
                <p class="text-center text-[11px] text-black/70">{{ label.labelFooter }}</p>
              </template>
            </div>
          </div>

          <div class="no-print mt-6">
            <AppButton block size="lg" @click="print">
              <template #icon><Printer class="size-5" /></template>
              {{ t('app.print') }}
            </AppButton>
          </div>
        </div>
      </DataState>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .label-sheet {
    border: none !important;
    box-shadow: none !important;
    margin: 0 auto;
    padding: 2mm;
  }
}
</style>
