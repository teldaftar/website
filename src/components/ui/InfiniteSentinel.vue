<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps<{ disabled?: boolean; loading?: boolean }>()
const emit = defineEmits<{ load: [] }>()

const el = ref<HTMLElement | null>(null)

const { isActive } = useIntersectionObserver(
  el,
  ([entry]) => {
    if (entry?.isIntersecting && !props.disabled && !props.loading) emit('load')
  },
  { rootMargin: '200px' },
)
// Keep observing regardless of disabled toggles.
watch(isActive, () => undefined)
</script>

<template>
  <div ref="el" class="flex h-12 items-center justify-center">
    <Loader2 v-if="loading" class="size-5 animate-spin text-fg-muted" />
  </div>
</template>
