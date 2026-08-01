import { uz } from './uz'

type Primitive = string | number

/**
 * Tiny i18n helper. Resolves a dotted key against the Uzbek dictionary and
 * interpolates `{param}` placeholders. Kept intentionally minimal — one
 * language ships now, but strings all live in `uz.ts`.
 *
 * @example t('debts.daysOverdue', { n: 3 }) // "3 kun kechikkan"
 */
export function t(path: string, params?: Record<string, Primitive>): string {
  const value = path
    .split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), uz)

  if (typeof value !== 'string') {
    // Surface the missing key instead of silently rendering nothing.
    return path
  }

  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  )
}

export { uz }
