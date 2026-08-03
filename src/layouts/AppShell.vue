<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SidebarNav from '@/components/shell/SidebarNav.vue'
import TopBar from '@/components/shell/TopBar.vue'
import BottomNav from '@/components/shell/BottomNav.vue'
import { transitionName } from '@/lib/transition'

const route = useRoute()
</script>

<template>
  <div class="flex min-h-dvh bg-bg">
    <SidebarNav />

    <div class="flex min-h-dvh w-full flex-col">
      <TopBar />

      <!-- Padding lives on <main>; the positioning context is the inner wrapper
           (no padding) so the absolutely-positioned leaving view (see main.css)
           lines up with the in-flow entering view — no vertical jump. -->
      <main class="flex-1 pt-5">
        <div class="relative min-h-full overflow-x-hidden">
          <RouterView v-slot="{ Component }">
            <Transition :name="transitionName">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>

      <BottomNav />
    </div>
  </div>
</template>
