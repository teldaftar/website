<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, ArrowDown } from 'lucide-vue-next'

const props = defineProps<{ onRefresh: () => Promise<unknown> }>()

const THRESHOLD = 70
const pull = ref(0)
const refreshing = ref(false)
let startY = 0
let tracking = false

function onStart(e: TouchEvent) {
  if (window.scrollY > 0 || refreshing.value) return
  startY = e.touches[0]?.clientY ?? 0
  tracking = true
}

function onMove(e: TouchEvent) {
  if (!tracking) return
  const dy = (e.touches[0]?.clientY ?? 0) - startY
  // Resist the pull so it feels rubbery; only downward pulls count.
  pull.value = dy > 0 ? Math.min(90, dy * 0.5) : 0
}

async function onEnd() {
  if (!tracking) return
  tracking = false
  if (pull.value >= THRESHOLD) {
    refreshing.value = true
    pull.value = 46
    try {
      await props.onRefresh()
    } finally {
      refreshing.value = false
      pull.value = 0
    }
  } else {
    pull.value = 0
  }
}
</script>

<template>
  <div @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd">
    <!-- Pull indicator -->
    <div
      class="flex items-center justify-center overflow-hidden text-fg-muted transition-[height] duration-150"
      :style="{ height: `${pull}px` }"
    >
      <Loader2 v-if="refreshing" class="size-5 animate-spin" />
      <ArrowDown
        v-else-if="pull > 4"
        class="size-5 transition-transform"
        :class="pull >= THRESHOLD ? 'rotate-180' : ''"
      />
    </div>
    <div :style="{ transform: `translateY(${refreshing ? 0 : 0}px)` }">
      <slot />
    </div>
  </div>
</template>
