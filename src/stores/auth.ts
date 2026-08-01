import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import {
  clearTokens,
  getRefreshToken,
  hasSession,
  registerForcedLogout,
  setTokens,
} from '@/api/session'
import type {
  AuthTokens,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  Shop,
  User,
} from '@/api/types'

type Status = 'idle' | 'loading' | 'ready'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const shop = ref<Shop | null>(null)
  const status = ref<Status>('idle')
  /** True once boot hydration has finished (success or not) — guards wait on this. */
  const ready = ref(false)

  const isAuthenticated = computed(() => !!user.value && hasSession())

  function setSession(u: User | null, s: Shop | null) {
    user.value = u
    shop.value = s
  }

  /** Keep the cached shop in sync after a profile edit. */
  function setShop(s: Shop) {
    shop.value = s
  }

  function reset() {
    setSession(null, null)
    clearTokens()
  }

  /** On boot: if tokens exist, validate + hydrate via /auth/me. */
  async function bootstrap() {
    if (!hasSession()) {
      ready.value = true
      return
    }
    status.value = 'loading'
    try {
      const info = await authApi.me()
      setSession(info.user, info.shop)
      status.value = 'ready'
    } catch {
      // Invalid/expired session that refresh couldn't save → clean slate.
      reset()
      status.value = 'idle'
    } finally {
      ready.value = true
    }
  }

  async function hydrateFrom(tokens: AuthTokens) {
    // login / register return only the token pair — hydrate user + shop via /auth/me.
    setTokens(tokens)
    const info = await authApi.me()
    setSession(info.user, info.shop)
    status.value = 'ready'
  }

  async function login(payload: LoginPayload) {
    const result = await authApi.login(payload)
    await hydrateFrom(result)
  }

  async function register(payload: RegisterPayload) {
    const result = await authApi.register(payload)
    await hydrateFrom(result)
  }

  async function logout() {
    const rt = getRefreshToken()
    if (rt) {
      // Best-effort server revoke; local reset happens regardless.
      await authApi.logout(rt).catch(() => undefined)
    }
    reset()
  }

  async function changePassword(payload: ChangePasswordPayload) {
    await authApi.changePassword(payload)
    // Backend revokes all sessions → force a clean re-login.
    reset()
  }

  // Let the axios interceptor reset app state when refresh ultimately fails.
  registerForcedLogout(() => {
    setSession(null, null)
  })

  return {
    user,
    shop,
    status,
    ready,
    isAuthenticated,
    bootstrap,
    login,
    register,
    logout,
    changePassword,
    setShop,
    reset,
  }
})
