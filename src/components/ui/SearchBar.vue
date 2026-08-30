<script setup lang="ts">
import { ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { Search, X } from 'lucide-vue-next'
import { t } from '@/i18n'

const props = withDefaults(defineProps<{ placeholder?: string; delay?: number }>(), {
  delay: 350,
})

/** Debounced search term — updates the bound model only after the user pauses. */
const model = defineModel<string>({ default: '' })
const local = ref(model.value)
const debounced = refDebounced(local, props.delay)

watch(debounced, (v) => {
  if (v !== model.value) model.value = v
})
watch(model, (v) => {
  if (v !== local.value) local.value = v
})

function clear() {
  local.value = ''
  model.value = ''
}
</script>

<template>
  <div class="relative flex items-center">
    <Search class="pointer-events-none absolute left-3.5 size-5 text-fg-muted" />
    <input
      v-model="local"
      type="search"
      inputmode="search"
      :placeholder="placeholder ?? t('app.search')"
      class="h-11 w-full rounded-lg border border-border-strong bg-surface pr-10 pl-11 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
    <button
      v-if="local"
      class="absolute right-2 grid size-7 place-items-center rounded-lg text-fg-muted hover:bg-surface-2"
      aria-label="Tozalash"
      @click="clear"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
