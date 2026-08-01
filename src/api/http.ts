import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from './types'
import { getAccessToken, getRefreshToken, setTokens, triggerForcedLogout } from './session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

/** Extra flag we set to mark a request that has already been retried post-refresh. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/** The one configured axios instance. Never hardcode URLs in components. */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
})

/* --- Request: attach the access token --------------------------------------- */
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/* --- Response: refresh-on-401 with a single-flight queue -------------------- */

/** True while a refresh call is in flight; concurrent 401s wait on it. */
let isRefreshing = false
/** Resolvers for requests parked while a refresh is happening. */
let waiters: Array<(token: string | null) => void> = []

function isAuthEndpoint(url?: string): boolean {
  return !!url && /\/auth\/(login|register|refresh)/.test(url)
}

/** Refresh once using a bare axios call (not `api`) to avoid interceptor recursion. */
async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, {
      refreshToken,
    })
    setTokens(data)
    return data.accessToken
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status

    const shouldRefresh = status === 401 && config && !config._retry && !isAuthEndpoint(config.url)

    if (!shouldRefresh || !config) {
      return Promise.reject(error)
    }

    // A refresh is already running — park this request until it settles.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error)
          config._retry = true
          config.headers = AxiosHeaders.from(config.headers)
          config.headers.set('Authorization', `Bearer ${token}`)
          resolve(api(config))
        })
      })
    }

    isRefreshing = true
    const token = await refreshTokens()
    isRefreshing = false

    // Release everyone that queued behind this refresh.
    const pending = waiters
    waiters = []
    pending.forEach((resolve) => resolve(token))

    if (!token) {
      triggerForcedLogout()
      return Promise.reject(error)
    }

    config._retry = true
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${token}`)
    return api(config)
  },
)
