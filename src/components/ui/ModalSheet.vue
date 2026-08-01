<script setup lang="ts">
import { computed, watch } from 'vue'
import { useMediaQuery, useScrollLock } from '@vueuse/core'
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title?: string
    /** Hide the built-in header (caller renders its own). */
    bare?: boolean
  }>(),
  { bare: false },
)

const open = defineModel<boolean>({ required: true })

// Bottom-sheet on mobile, centered dialog on desktop.
const isDesktop = useMediaQuery('(min-width: 1024px)')
const transitionName = computed(() => (isDesktop.value ? 'dialog' : 'sheet'))

const locked = useScrollLock(document.body)
watch(
  open,
  (v) => {
    locked.value = v
  },
  { immediate: true },
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        @click="open = false"
        @keydown="onKey"
      />
    </Transition>

    <Transition :name="transitionName">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-50 lg:inset-0 lg:grid lg:place-items-center lg:p-4"
        role="dialog"
        aria-modal="true"
        @keydown="onKey"
      >
        <div
          class="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface pb-safe shadow-2xl lg:max-w-lg lg:rounded-3xl lg:pb-0"
          @click.stop
        >
          <!-- Grab handle (mobile) -->
          <div class="flex justify-center pt-2.5 lg:hidden">
            <span class="h-1.5 w-10 rounded-full bg-border" />
          </div>

          <header
            v-if="!bare"
            class="flex items-center justify-between gap-2 px-5 pt-3 pb-2 lg:pt-5"
          >
            <h2 class="text-lg font-bold text-fg">{{ title }}</h2>
            <button
              class="-mr-1 grid size-9 place-items-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Yopish"
              @click="open = false"
            >
              <X class="size-5" />
            </button>
          </header>

          <div class="px-5 pt-1 pb-6 lg:pb-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
