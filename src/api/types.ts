/**
 * API DTOs — reconciled against the live backend OpenAPI spec (openapi.json at
 * repo root, fetched from http://localhost:3000/api/docs-json). Single source of
 * truth for the app's server types. No `any` crosses this boundary.
 */

/* ----------------------------------------------------------------------------
 * Shared
 * ------------------------------------------------------------------------- */

export interface Paginated<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/** Every backend error has this shape. */
export interface ApiError {
  statusCode: number
  code: string
  message: string
  details?: Record<string, unknown>
}

export type SortOrder = 'ASC' | 'DESC'

/* ----------------------------------------------------------------------------
 * Auth / session
 * ------------------------------------------------------------------------- */

/** TokenPairDto — returned by login / register / refresh. */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

export interface User {
  id: string
  fullName: string
  login: string
  role?: string
  isActive?: boolean
}

export interface Shop {
  id: string
  name: string
  address?: string | null
  phone?: string | null
  labelFooter?: string | null
  createdAt?: string
  updatedAt?: string
}

/** Response of `GET /auth/me`. */
export interface SessionInfo {
  user: User
  shop: Shop
}

export interface LoginPayload {
  login: string
  password: string
}

export interface RegisterPayload {
  shopName: string
  fullName: string
  login: string
  password: string
  confirmPassword: string
  inviteCode?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateShopPayload {
  name?: string
  address?: string
  phone?: string
  labelFooter?: string
}

/* ----------------------------------------------------------------------------
 * Phones
 * ------------------------------------------------------------------------- */

export type PhoneCondition = 'NEW' | 'USED'
export type PhoneStatus = 'IN_STOCK' | 'SOLD'

export interface Phone {
  id: string
  name: string
  imei?: string | null
  purchasePrice: number
  listPrice?: number | null
  /** Set once the phone is sold (null while IN_STOCK). */
  salePrice?: number | null
  /** Set once the phone is sold (null while IN_STOCK). */
  profit?: number | null
  condition?: PhoneCondition | null
  ramGb?: number | null
  storageGb?: number | null
  note?: string | null
  imageUrl?: string | null
  status: PhoneStatus
  /** Present when the phone was sold on debt (null for a cash sale). */
  debt?: EmbeddedDebt | null
  createdAt: string
  updatedAt: string
}

export interface PhoneListQuery {
  status?: PhoneStatus
  condition?: PhoneCondition
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
  sort?: 'createdAt' | 'name' | 'purchasePrice'
  order?: SortOrder
}

export interface CreatePhonePayload {
  name: string
  /** Optional. NB: the backend currently marks this required — see README. */
  imei?: string
  purchasePrice: number
  listPrice?: number | null
  condition?: PhoneCondition
  ramGb?: number | null
  storageGb?: number | null
  note?: string | null
  imageUrl?: string | null
}

export type UpdatePhonePayload = Partial<CreatePhonePayload>

/** Response of `GET /phones/:id/label` — data only, layout is client-side. */
export interface PhoneLabel {
  shopName: string
  name: string
  memory?: string | null
  condition?: PhoneCondition | null
  imei: string
  labelFooter?: string | null
}

/* ----------------------------------------------------------------------------
 * Accessories
 * ------------------------------------------------------------------------- */

export interface Accessory {
  id: string
  name: string
  purchasePrice: number
  salePrice?: number | null
  quantity: number
  note?: string | null
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface AccessoryListQuery {
  search?: string
  inStock?: boolean
  page?: number
  limit?: number
}

export interface CreateAccessoryPayload {
  name: string
  purchasePrice: number
  quantity: number
  salePrice?: number | null
  note?: string | null
  imageUrl?: string | null
}

export type UpdateAccessoryPayload = Partial<
  Pick<CreateAccessoryPayload, 'name' | 'purchasePrice' | 'salePrice' | 'note' | 'imageUrl'>
>

export interface StockEntry {
  id: string
  quantity: number
  purchasePrice: number
  note?: string | null
  createdAt: string
}

export interface AddStockPayload {
  quantity: number
  purchasePrice: number
  note?: string
}

/** Sold-accessory summary row — `GET /accessories/sold` (one row per accessory). */
export interface SoldAccessoryRow {
  accessoryId: string
  name: string
  imageUrl?: string | null
  soldQty: number
  soldAmount: number
  soldCostAmount: number
  profit: number
  currentQuantity: number
  purchasePrice: number
  salePrice?: number | null
}

/** One price-breakdown line within a sold accessory. */
export interface SoldAccessoryLine {
  unitPrice: number
  costPrice: number
  quantity: number
  amount: number
  costAmount: number
  profit: number
}

/** Sold-accessory detail — `GET /accessories/:id/sold` (totals + price breakdown). */
export interface SoldAccessoryDetail {
  accessoryId: string
  name: string
  imageUrl?: string | null
  currentQuantity: number
  purchasePrice: number
  salePrice?: number | null
  soldQty: number
  soldAmount: number
  soldCostAmount: number
  profit: number
  lines: SoldAccessoryLine[]
}

export interface SoldAccessoryListQuery {
  search?: string
  page?: number
  limit?: number
}

/* ----------------------------------------------------------------------------
 * Sales
 * ------------------------------------------------------------------------- */

export type SaleType = 'PHONE' | 'ACCESSORY'
export type SaleStatus = 'COMPLETED' | 'PARTIALLY_RETURNED' | 'RETURNED'

export interface DebtInput {
  amount: number
  dueDate: string
  customerName: string
  customerPhone: string
}

/** A payment as embedded in a sale/phone debt object (lighter than DebtPayment). */
export interface EmbeddedDebtPayment {
  amount: number
  paidAt: string
  note?: string | null
}

/**
 * Debt object embedded in a sale (SaleResponse) or sold phone (PhoneResponse) —
 * the same shape in both places. `payments` is populated on the detail endpoints;
 * list endpoints may omit it (only `amount`, the remaining, is needed there).
 */
export interface EmbeddedDebt {
  id: string
  saleId: string
  customerName: string
  customerPhone: string
  /** Debt amount at sale time, before any payments. */
  originalAmount: number
  /** Amount still owed (remaining). */
  amount: number
  /** Sum of all payments made against this debt. */
  paidTotal: number
  dueDate: string
  status: DebtStatus
  isOverdue: boolean
  daysOverdue: number
  payments?: EmbeddedDebtPayment[]
}

/** Product snapshot embedded in each sale item. */
export interface SaleProductSnapshot {
  id: string
  name: string
  imei?: string | null
  memory?: string | null
  imageUrl?: string | null
}

export interface SaleItem {
  id: string
  itemType: SaleType
  quantity: number
  unitPrice: number
  costPrice: number
  lineTotal: number
  returnedQuantity: number
  product: SaleProductSnapshot
}

export interface Sale {
  id: string
  code: string
  type: SaleType
  totalAmount: number
  paidAmount: number
  debtAmount: number
  status: SaleStatus
  note?: string | null
  soldAt: string
  profit: number
  items: SaleItem[]
  debt?: EmbeddedDebt | null
}

export interface SaleListQuery {
  type?: SaleType
  isDebt?: boolean
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreatePhoneSalePayload {
  phoneId: string
  price: number
  note?: string
  debt?: DebtInput
}

export interface CreateAccessorySalePayload {
  accessoryId: string
  quantity: number
  unitPrice?: number
  note?: string
  debt?: DebtInput
}

export interface ReturnPayload {
  saleItemId: string
  quantity: number
  amount?: number
  reason: string
}

export interface SaleReturn {
  id: string
  saleItemId: string
  quantity: number
  amount: number
  reason: string
  createdAt: string
}

/* ----------------------------------------------------------------------------
 * Debts
 * ------------------------------------------------------------------------- */

export type DebtStatus = 'OPEN' | 'PAID' | 'CANCELLED'

export interface Debt {
  id: string
  saleId: string
  saleCode: string
  customerName: string
  customerPhone: string
  productName: string
  saleTotalAmount: number
  paidAmount: number
  /** Amount still owed (outstanding); decreases as payments are made. */
  amount: number
  /** Sum of all payments made against this debt. */
  paidTotal: number
  dueDate: string
  status: DebtStatus
  paidAt?: string | null
  note?: string | null
  isOverdue: boolean
  daysOverdue: number
  createdAt: string
}

/** A single payment recorded against a debt (GET /debts/:id/payments). */
export interface DebtPayment {
  id: string
  debtId: string
  amount: number
  paidAt: string
  note?: string | null
  createdAt: string
}

export interface DebtListQuery {
  status?: DebtStatus
  overdue?: boolean
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface PayDebtPayload {
  /** Amount to pay now; must not exceed the outstanding remaining. */
  amount: number
  paidAt?: string
  note?: string
}

export interface UpdateDebtPayload {
  dueDate?: string
  note?: string
}

/* ----------------------------------------------------------------------------
 * Expenses
 * ------------------------------------------------------------------------- */

export interface Expense {
  id: string
  amount: number
  note: string
  spentAt: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseListQuery {
  from?: string
  to?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateExpensePayload {
  amount: number
  note: string
  spentAt?: string
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>

/* ----------------------------------------------------------------------------
 * Statistics
 * ------------------------------------------------------------------------- */

export interface PhoneStats {
  purchasedCount: number
  purchasedAmount: number
  soldCount: number
  soldAmount: number
  soldCostAmount: number
  profit: number
  returnedCount: number
  returnedAmount: number
  soldOnDebtCount: number
  soldOnDebtAmount: number
  /** Current snapshot — NOT range-bound. */
  inStockCount: number
  inStockCostAmount: number
}

export interface AccessoryStats {
  purchasedQty: number
  purchasedAmount: number
  soldQty: number
  soldAmount: number
  soldCostAmount: number
  profit: number
  returnedQty: number
  returnedAmount: number
  /** Current snapshot — NOT range-bound. */
  remainingQty: number
  remainingCostAmount: number
}

export interface ExpenseStats {
  count: number
  total: number
}

export interface DebtStats {
  openCount: number
  openAmount: number
  overdueCount: number
  overdueAmount: number
  createdInRangeCount: number
  createdInRangeAmount: number
  collectedInRange: number
}

export interface TotalsStats {
  grossProfit: number
  netProfit: number
  cashIn: number
  cashOut: number
}

export interface StatisticsSummary {
  range: { from: string; to: string }
  phones: PhoneStats
  accessories: AccessoryStats
  expenses: ExpenseStats
  debts: DebtStats
  totals: TotalsStats
}

export interface DailyStat {
  date: string
  salesAmount: number
  profit: number
  expenses: number
  debtCollected: number
}

export interface StatRangeQuery {
  from?: string
  to?: string
}

/* ----------------------------------------------------------------------------
 * Uploads
 * ------------------------------------------------------------------------- */

export interface UploadResult {
  url: string
  key?: string
}
