import { format, isValid, parseISO, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { t } from '@/i18n'

/** The shop operates in a single timezone; the backend interprets ranges here. */
export const APP_TZ = 'Asia/Tashkent'

const SOM = "so'm"
/** Shown instead of "0 so'm" for a free (tekin) purchase/cost price. */
const TEKIN = 'Tekin'

/**
 * Format an amount as UZS with thin thousands separators + `so'm` suffix.
 * e.g. formatMoney(3000000) -> "3 000 000 so'm". Use everywhere — never print
 * raw numbers.
 */
export function formatMoney(n: number | null | undefined): string {
  const value = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return `${groupThousands(Math.round(value))} ${SOM}`
}

/**
 * A purchase/cost price for display: `0` reads as "Tekin" (free intake) instead
 * of "0 so'm"; anything else formats like `formatMoney`. Use wherever an
 * `purchasePrice` / `costPrice` is shown. Sale/list prices stay money-formatted.
 */
export function formatCost(n: number | null | undefined): string {
  return n === 0 ? TEKIN : formatMoney(n)
}

/** Grouped number without the currency suffix (for compact/chart contexts). */
export function formatNumber(n: number | null | undefined): string {
  const value = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return groupThousands(Math.round(value))
}

function groupThousands(n: number): string {
  const sign = n < 0 ? '-' : ''
  const digits = Math.abs(n).toString()
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function toDate(input: string | number | Date): Date | null {
  if (input instanceof Date) return isValid(input) ? input : null
  if (typeof input === 'number') {
    const d = new Date(input)
    return isValid(d) ? d : null
  }
  const parsed = parseISO(input)
  return isValid(parsed) ? parsed : null
}

/** Date only, in Asia/Tashkent — e.g. "01.08.2026". */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (input == null) return '—'
  const d = toDate(input)
  if (!d) return '—'
  return formatInTimeZone(d, APP_TZ, 'dd.MM.yyyy')
}

/** Date + time, in Asia/Tashkent — e.g. "01.08.2026 14:30". */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (input == null) return '—'
  const d = toDate(input)
  if (!d) return '—'
  return formatInTimeZone(d, APP_TZ, 'dd.MM.yyyy HH:mm')
}

/** Time only, in Asia/Tashkent — e.g. "14:30". */
export function formatTime(input: string | number | Date | null | undefined): string {
  if (input == null) return '—'
  const d = toDate(input)
  if (!d) return '—'
  return formatInTimeZone(d, APP_TZ, 'HH:mm')
}

/** Today's date in Asia/Tashkent as `yyyy-MM-dd` (for date-input mins/defaults). */
export function todayISO(): string {
  return formatInTimeZone(new Date(), APP_TZ, 'yyyy-MM-dd')
}

/**
 * The calendar day (in Asia/Tashkent) an instant falls on, as `yyyy-MM-dd`.
 * Stable key for grouping a list by day. Empty string for invalid input.
 */
export function dayKey(input: string | number | Date | null | undefined): string {
  if (input == null) return ''
  const d = toDate(input)
  if (!d) return ''
  return formatInTimeZone(d, APP_TZ, 'yyyy-MM-dd')
}

/**
 * Human label for a `yyyy-MM-dd` day key: "Bugun" / "Kecha" for today &
 * yesterday (Asia/Tashkent), otherwise a formatted date ("01.09.2026").
 */
export function dayLabel(key: string): string {
  if (!key) return '—'
  const today = todayISO()
  if (key === today) return t('app.today')
  if (key === format(subDays(parseISO(today), 1), 'yyyy-MM-dd')) return t('app.yesterday')
  return formatDate(key)
}

/** One day-bucket of a list grouped by calendar day (Asia/Tashkent). */
export interface DayGroup<T> {
  /** `yyyy-MM-dd` key. */
  key: string
  /** Display label ("Bugun" / "Kecha" / "01.09.2026"). */
  label: string
  items: T[]
}

/**
 * Group a list into calendar-day buckets (Asia/Tashkent) using `getDate` to
 * pull the instant from each item. Groups are ordered newest-day-first by
 * default; pass `order: 'ASC'` for oldest-first. Item order within a group is
 * preserved from the input, so the caller's sort still holds inside each day.
 */
export function groupByDay<T>(
  items: readonly T[],
  getDate: (item: T) => string | number | Date | null | undefined,
  order: 'ASC' | 'DESC' = 'DESC',
): DayGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = dayKey(getDate(item))
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  const groups = Array.from(map, ([key, groupItems]) => ({
    key,
    label: dayLabel(key),
    items: groupItems,
  }))
  groups.sort((a, b) => (order === 'ASC' ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)))
  return groups
}

/** Current calendar month range (Asia/Tashkent) as `{ from, to }` ISO dates. */
export function currentMonthRange(): { from: string; to: string } {
  const today = parseISO(todayISO())
  return {
    from: format(startOfMonth(today), 'yyyy-MM-dd'),
    to: format(endOfMonth(today), 'yyyy-MM-dd'),
  }
}

/** `yyyy-MM-dd` for date inputs / query params (interpreted in APP_TZ by backend). */
export function toDateInputValue(input: string | number | Date | null | undefined): string {
  if (input == null) return ''
  const d = toDate(input)
  if (!d) return ''
  return format(d, 'yyyy-MM-dd')
}

/**
 * Pretty phone for display: "998901234567" -> "+998 90 123 45 67".
 * Falls back to the raw input if it doesn't match the expected shape.
 */
export function formatPhone(input: string | null | undefined): string {
  if (!input) return '—'
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('998')) {
    const p = digits.slice(3)
    return `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`
  }
  return input
}

/**
 * Normalise arbitrary user input to `998XXXXXXXXX` for submits.
 * Accepts "+998 90 …", "90 …", "8 90 …" etc. Returns the best-effort 12-digit form.
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return ''
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('998')) {
    // already prefixed
  } else if (digits.length === 9) {
    digits = '998' + digits
  } else if (digits.length === 10 && digits.startsWith('0')) {
    digits = '998' + digits.slice(1)
  }
  return digits.slice(0, 12)
}

/**
 * Memory string like "8 GB / 256 GB". Prefer the backend's pre-formatted
 * `memory` field when present; this mirrors it for create/edit previews.
 */
export function formatMemory(ram?: number | null, storage?: number | null): string {
  const parts: string[] = []
  if (ram) parts.push(`${ram} GB`)
  if (storage) parts.push(`${storage} GB`)
  return parts.join(' / ')
}

/** Resolve an image URL that may be relative to the API host. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  const base = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}
