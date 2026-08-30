<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SidebarNav from '@/components/shell/SidebarNav.vue'
import TopBar from '@/components/shell/TopBar.vue'
import BottomNav from '@/components/shell/BottomNav.vue'
import { transitionName } from '@/lib/transition'
import { prefetchRoutes } from '@/router/prefetch'

const route = useRoute()

// The shell only mounts for authenticated users — warm the other screens now so
// switching pages from the menu is instant on the first visit too.
onMounted(prefetchRoutes)
</script>

<template>
  <div class="flex min-h-dvh bg-bg">
    <SidebarNav />

    <div class="flex min-h-dvh w-full flex-col">
      <TopBar />

      <!-- Padding lives on <main>; the positioning context is the inner wrapper
           (no padding) so the absolutely-positioned leaving view (see main.css)
           lines up with the in-flow entering view — no vertical jump. -->
      <main class="flex-1 lg:pt-5">
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
