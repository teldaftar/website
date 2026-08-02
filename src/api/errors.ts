import axios from 'axios'
import type { ApiError } from './types'
import { t, uz } from '@/i18n'

/** Codes that have a richer message when `details` are present. */
const DETAIL_CODES = new Set([
  'INSUFFICIENT_STOCK',
  'RETURN_EXCEEDS_SOLD',
  'RETURN_AMOUNT_EXCEEDS_SOLD',
  'PAYMENT_EXCEEDS_REMAINING',
])

/** Normalise anything thrown by axios / the app into the backend's error shape. */
export function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<ApiError> | undefined
    if (data && typeof data.code === 'string') {
      return {
        statusCode: err.response?.status ?? data.statusCode ?? 0,
        code: data.code,
        message: typeof data.message === 'string' ? data.message : '',
        details: data.details,
      }
    }
    // No structured body — likely a network / timeout failure.
    if (!err.response) {
      return { statusCode: 0, code: 'NETWORK', message: err.message }
    }
    return {
      statusCode: err.response.status,
      code: 'UNKNOWN',
      message: err.message,
    }
  }
  if (err instanceof Error) {
    return { statusCode: 0, code: 'UNKNOWN', message: err.message }
  }
  return { statusCode: 0, code: 'UNKNOWN', message: String(err) }
}

/**
 * Map a backend error code (+ optional details) to a user-facing Uzbek string.
 * Unknown codes fall back to a generic message. Some codes use `details`
 * (available / remaining / maxAmount) for a more helpful message.
 */
export function mapErrorCode(code: string, details?: Record<string, unknown>): string {
  if (code === 'NETWORK') return t('errors.network')

  const dict = uz.errors as Record<string, string>

  if (DETAIL_CODES.has(code) && details) {
    const detailKey = `${code}_DETAIL`
    if (detailKey in dict) {
      return t(`errors.${detailKey}`, {
        available: num(details.available),
        remaining: num(details.remaining),
        maxAmount: num(details.maxAmount),
      })
    }
  }

  if (code in dict) return t(`errors.${code}`)
  return t('errors.generic')
}

/** Convenience: normalise + map in one call, for toasts. */
export function toUserMessage(err: unknown): string {
  const e = normalizeError(err)
  return mapErrorCode(e.code, e.details)
}

/**
 * Field-level errors for forms from a VALIDATION_FAILED response.
 * Returns a `{ field: message }` map when the backend supplies `details.errors`.
 */
export function fieldErrors(err: unknown): Record<string, string> {
  const e = normalizeError(err)
  const out: Record<string, string> = {}
  const errors = e.details?.errors
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (item && typeof item === 'object') {
        const field = (item as Record<string, unknown>).field
        const message = (item as Record<string, unknown>).message
        if (typeof field === 'string' && typeof message === 'string') {
          out[field] = message
        }
      }
    }
  }
  return out
}

function num(v: unknown): string {
  return typeof v === 'number' ? v.toLocaleString('ru-RU').replace(/,/g, ' ') : String(v ?? '')
}
