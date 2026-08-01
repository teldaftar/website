import type { AuthTokens } from './types'

/**
 * Low-level token holder shared by the axios interceptor and the auth store.
 * Kept as a plain module (not Pinia) so `http.ts` can read/rotate tokens
 * without importing the store — that would create a cycle
 * (store → http → store).
 *
 * XSS trade-off: tokens live in `localStorage` so a page reload keeps the
 * session. That means a successful XSS could read them. Acceptable for this
 * internal, single-owner shop tool; revisit if it ever goes multi-user/public.
 */

const ACCESS_KEY = 'auth.access'
const REFRESH_KEY = 'auth.refresh'

let accessToken: string | null = localStorage.getItem(ACCESS_KEY)
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY)

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return refreshToken
}

export function hasSession(): boolean {
  return !!accessToken && !!refreshToken
}

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  accessToken = null
  refreshToken = null
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** The auth store registers a handler so a failed refresh can reset app state. */
type LogoutHandler = () => void
let onForcedLogout: LogoutHandler | null = null

export function registerForcedLogout(fn: LogoutHandler): void {
  onForcedLogout = fn
}

export function triggerForcedLogout(): void {
  clearTokens()
  onForcedLogout?.()
}
