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

      <!-- Leaving views are absolutely positioned (see main.css) so the
           direction-aware slide cross-fades without a layout jump. -->
      <main class="relative flex-1 overflow-x-hidden">
        <RouterView v-slot="{ Component }">
          <Transition :name="transitionName">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>

      <BottomNav />
    </div>
  </div>
</template>
