/**
 * Warm the lazy route chunks in the background so the FIRST navigation to each
 * screen is instant (no download/parse pause — most noticeable on mobile).
 *
 * Each loader uses the SAME dynamic-import specifier as the route definition, so
 * Vite resolves it to the same chunk: once warmed here, the router's own
 * `import()` resolves synchronously from the module cache. Chunks are fetched
 * one at a time during idle time to avoid competing with the initial data load.
 */
const loaders: Array<() => Promise<unknown>> = [
  () => import('@/views/phones/PhonesView.vue'),
  () => import('@/views/accessories/AccessoriesView.vue'),
  () => import('@/views/receipts/ReceiptsView.vue'),
  () => import('@/views/receipts/NewReceiptView.vue'),
  () => import('@/views/sales/SalesHistoryView.vue'),
  () => import('@/views/debts/DebtsView.vue'),
  () => import('@/views/expenses/ExpensesView.vue'),
  () => import('@/views/MoreView.vue'),
  () => import('@/views/settings/SettingsView.vue'),
  () => import('@/views/phones/PhoneDetailView.vue'),
  () => import('@/views/accessories/AccessoryDetailView.vue'),
  () => import('@/views/sales/SaleDetailView.vue'),
  () => import('@/views/receipts/ReceiptDetailView.vue'),
]

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void
}

function schedule(fn: () => void): void {
  if (typeof window === 'undefined') return
  const ric = (window as IdleWindow).requestIdleCallback
  if (ric) ric(fn, { timeout: 2000 })
  else setTimeout(fn, 300)
}

let started = false

/** Idempotent: kicks off background prefetch once (call after login/app mount). */
export function prefetchRoutes(): void {
  if (started) return
  started = true

  let i = 0
  const step = () => {
    const load = loaders[i++]
    if (!load) return
    load()
      .catch(() => undefined)
      .finally(() => schedule(step))
  }
  schedule(step)
}
