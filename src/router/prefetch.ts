/**
 * Warm the lazy route chunks in the background so the FIRST navigation to each
 * screen is instant (no download/parse pause — most noticeable on mobile).
 *
 * Each loader uses the SAME dynamic-import specifier as the route definition, so
 * Vite resolves it to the same chunk: once warmed here, the router's own
 * `import()` resolves synchronously from the module cache. Chunks are fetched in
 * small parallel batches shortly after mount so the whole menu is ready within a
 * second, instead of trickling in one-per-idle-tick.
 */
const loaders: Array<() => Promise<unknown>> = [
  // Top-level destinations first — these are the most likely first taps.
  () => import('@/views/phones/PhonesView.vue'),
  () => import('@/views/accessories/AccessoriesView.vue'),
  () => import('@/views/sales/NewSaleView.vue'),
  () => import('@/views/MoreView.vue'),
  () => import('@/views/receipts/ReceiptsView.vue'),
  () => import('@/views/sales/SalesHistoryView.vue'),
  () => import('@/views/debts/DebtsView.vue'),
  () => import('@/views/expenses/ExpensesView.vue'),
  () => import('@/views/creditors/CreditorsView.vue'),
  () => import('@/views/settings/SettingsView.vue'),
  () => import('@/views/receipts/NewReceiptView.vue'),
  // Detail screens last.
  () => import('@/views/phones/PhoneDetailView.vue'),
  () => import('@/views/accessories/AccessoryDetailView.vue'),
  () => import('@/views/sales/SaleDetailView.vue'),
  () => import('@/views/receipts/ReceiptDetailView.vue'),
]

const BATCH_SIZE = 3

let started = false

/** Idempotent: kicks off background prefetch once (call after login/app mount). */
export function prefetchRoutes(): void {
  if (started) return
  started = true
  if (typeof window === 'undefined') return

  let i = 0
  const runBatch = () => {
    const batch = loaders.slice(i, i + BATCH_SIZE)
    i += BATCH_SIZE
    if (!batch.length) return
    Promise.allSettled(batch.map((load) => load())).finally(() => {
      // Yield briefly between batches so we don't saturate the network while the
      // first screen's own data is still loading.
      setTimeout(runBatch, 120)
    })
  }

  // Small delay lets the initial view + its data request go out first.
  setTimeout(runBatch, 250)
}
