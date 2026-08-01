import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemePref = 'light' | 'dark' | 'system'

const THEME_KEY = 'ui.theme'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readStored(): ThemePref {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

/** UI preferences: theme (persisted, respects system default). */
export const useUiStore = defineStore('ui', () => {
  const theme = ref<ThemePref>(readStored())

  function isDark(): boolean {
    return theme.value === 'dark' || (theme.value === 'system' && systemPrefersDark())
  }

  function apply() {
    document.documentElement.classList.toggle('dark', isDark())
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark() ? '#0b1020' : '#4f46e5')
  }

  function setTheme(next: ThemePref) {
    theme.value = next
    if (next === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, next)
    apply()
  }

  /** Simple light⇄dark toggle for the top-bar / settings switch. */
  function toggleDark() {
    setTheme(isDark() ? 'light' : 'dark')
  }

  // React to system changes while on 'system'.
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', () => {
    if (theme.value === 'system') apply()
  })

  watch(theme, apply, { immediate: true })

  return { theme, isDark, setTheme, toggleDark, apply }
})
