<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    icon?: Component
    title?: string
    text?: string
  }>(),
  { icon: undefined, title: '', text: '' },
)
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="mb-4 grid size-16 place-items-center rounded-2xl bg-surface-2 text-fg-muted">
      <component :is="icon ?? Inbox" class="size-8" />
    </div>
    <h3 v-if="title" class="text-base font-semibold text-fg">{{ title }}</h3>
    <p v-if="text" class="mt-1 max-w-xs text-sm text-fg-muted">{{ text }}</p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>
