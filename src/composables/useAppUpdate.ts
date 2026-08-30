import { ref } from 'vue'
import { useIntervalFn, useEventListener } from '@vueuse/core'

// The build id baked into this bundle (see vite.config.ts).
const CURRENT = __APP_VERSION__

// How often to poll for a newer deploy while the tab stays open.
const POLL_MS = 60_000

/**
 * Detects when a newer build has been deployed. Polls `/version.json` (emitted
 * at build time) on an interval and whenever the tab regains focus, comparing
 * the served id against the one baked into this bundle. When they differ, a new
 * deploy has happened and `updateAvailable` flips to true so the UI can prompt
 * the user to reload.
 *
 * In dev there is no version.json (the emitter only runs on `build`), so the
 * fetch/parse quietly fails and no prompt is shown — which is the desired
 * behaviour.
 */
export function useAppUpdate() {
  const updateAvailable = ref(false)

  async function check() {
    // Once we've detected an update there's nothing more to poll for.
    if (updateAvailable.value) return
    try {
      // Cache-bust so we never read a stale copy from disk/proxy caches.
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { version?: string }
      if (data?.version && data.version !== CURRENT) {
        updateAvailable.value = true
      }
    } catch {
      // Offline, dev mode, or a non-JSON SPA fallback — ignore and retry later.
    }
  }

  useIntervalFn(check, POLL_MS)

  // A returning user is the most likely moment to have missed a deploy.
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })

  function reload() {
    window.location.reload()
  }

  return { updateAvailable, check, reload }
}
