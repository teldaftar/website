<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Slim top progress bar that gives instant feedback the moment a navigation
 * starts — the first visit to a lazy-loaded screen can take a beat to fetch its
 * chunk, and without this the tap felt dead for ~1s. It creeps toward 90% while
 * the route resolves, then snaps to 100% and fades out.
 */
const router = useRouter()

const width = ref(0)
const visible = ref(false)
let creep: ReturnType<typeof setInterval> | null = null
let hideT: ReturnType<typeof setTimeout> | null = null

function start() {
  if (hideT) {
    clearTimeout(hideT)
    hideT = null
  }
  visible.value = true
  width.value = 8
  if (creep) clearInterval(creep)
  creep = setInterval(() => {
    // Ease toward 90% and slow down as it gets there.
    width.value = Math.min(90, width.value + (90 - width.value) * 0.18)
  }, 160)
}

function done() {
  if (creep) {
    clearInterval(creep)
    creep = null
  }
  width.value = 100
  hideT = setTimeout(() => {
    visible.value = false
    width.value = 0
  }, 280)
}

// Only show the bar when the target chunk isn't ready yet — instant, cached
// navigations shouldn't flash the bar. We start on beforeEach and always finish.
router.beforeEach((to, from, next) => {
  if (to.path !== from.path) start()
  next()
})
router.afterEach(() => done())
router.onError(() => done())

onUnmounted(() => {
  if (creep) clearInterval(creep)
  if (hideT) clearTimeout(hideT)
})
</script>

<template>
  <div
    v-show="visible"
    class="route-progress"
    :style="{ width: width + '%', opacity: width >= 100 ? 0 : 1 }"
  />
</template>
