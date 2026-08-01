import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

/**
 * Direction-aware page transition. Deeper path → forward (slide in from right),
 * shallower path → back (slide out to right), same depth → cross-fade.
 * The name maps to CSS classes defined in `assets/main.css`.
 */
export const transitionName = ref<'nav-forward' | 'nav-back' | 'nav-fade'>('nav-fade')

function depth(route: RouteLocationNormalized): number {
  return route.path.split('/').filter(Boolean).length
}

export function resolveTransition(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): void {
  const d = depth(to) - depth(from)
  transitionName.value = d > 0 ? 'nav-forward' : d < 0 ? 'nav-back' : 'nav-fade'
}
