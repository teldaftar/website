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
/** Grade of a used phone — only set when condition is USED (null otherwise). */
export type UsedGrade = 'GOOD' | 'MEDIUM' | 'BAD'
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
  /** Set only when condition is USED (null for NEW / unset). */
  usedGrade?: UsedGrade | null
  /** Whether the phone still has its original box (optional). */
  hasBox?: boolean | null
  /** Whether the phone comes with a charger (optional). */
  hasCharger?: boolean | null
  ramGb?: number | null
  storageGb?: number | null
  note?: string | null
  imageUrl?: string | null
  /** Who the phone was bought from (all optional) — for follow-up contact. */
  supplierName?: string | null
  supplierSurname?: string | null
  supplierPhone?: string | null
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
  /** Optional, free-form text up to 500 chars — no digit-count rule anymore. */
  imei?: string
  purchasePrice: number
  listPrice?: number | null
  condition?: PhoneCondition
  /** Set only when condition is USED (send null / omit for NEW). */
  usedGrade?: UsedGrade | null
  /** Whether the phone still has its original box (optional). */
  hasBox?: boolean | null
  /** Whether the phone comes with a charger (optional). */
  hasCharger?: boolean | null
  ramGb?: number | null
  storageGb?: number | null
  note?: string | null
  imageUrl?: string | null
  /** Supplier (person the phone was bought from) — all optional. */
  supplierName?: string | null
  supplierSurname?: string | null
  supplierPhone?: string | null
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

/**
 * Discriminates the two product families that share the accessory model /
 * endpoints. `KEYPAD_PHONE` (klaviaturali telefon) behaves exactly like an
 * `ACCESSORY` (batch cost, intake via receipts, batch-picked sale) but gets its
 * own page, sale type and statistics row.
 */
export type AccessoryKind = 'ACCESSORY' | 'KEYPAD_PHONE'

export interface Accessory {
  id: string
  kind: AccessoryKind
  name: string
  /** Free-form IMEI — only meaningful for keypad phones (null/omitted for accessories). */
  imei?: string | null
  /**
   * Cost of the OLDEST remaining FIFO batch — i.e. the price the next unit sold
   * will be costed at ("hozir shu narxdan sotilyapti"). 0 = tekin.
   */
  purchasePrice: number
  salePrice?: number | null
  quantity: number
  note?: string | null
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface AccessoryListQuery {
  /** Omit → backend returns only ACCESSORY. Send KEYPAD_PHONE for the phones page. */
  kind?: AccessoryKind
  search?: string
  inStock?: boolean
  page?: number
  limit?: number
}

export interface CreateAccessoryPayload {
  name: string
  kind?: AccessoryKind
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
  /** How many units from THIS batch are still unsold (FIFO). */
  remainingQuantity: number
  purchasePrice: number
  note?: string | null
  createdAt: string
}

/** Sold-accessory summary row — `GET /accessories/sold` (one row per accessory). */
export interface SoldAccessoryRow {
  accessoryId: string
  kind?: AccessoryKind
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
  kind?: AccessoryKind
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
  kind?: AccessoryKind
  search?: string
  page?: number
  limit?: number
}

/* ----------------------------------------------------------------------------
 * Stock receipts (Kirim / Prixod)
 *
 * Document-level accessory intake: one receipt covers many lines at once, can
 * create brand-new accessories inline, and records a supplier + totals.
 * ------------------------------------------------------------------------- */

/** One row of `GET /stock-receipts` (list). */
export interface StockReceiptRow {
  id: string
  code: string // "P-000123"
  supplierName?: string | null
  supplierPhone?: string | null
  totalAmount: number // sum of all line totals (UZS)
  totalQty: number // sum of all quantities
  itemCount: number // number of lines
  note?: string | null
  receivedAt: string // ISO datetime
}

/** One line within a receipt (present on the detail endpoint). */
export interface StockReceiptItem {
  id: string
  accessoryId: string
  /** Which product family this line fed (accessory vs keypad phone). */
  kind?: AccessoryKind
  name: string // accessory name (snapshot-friendly)
  imageUrl?: string | null
  quantity: number
  /** How many units from THIS receipt line are still unsold (FIFO). */
  remaining: number
  purchasePrice: number // unit cost of this intake (may be 0 = tekin)
  lineTotal: number // quantity * purchasePrice
}

/** `GET /stock-receipts/:id` and the create response — row + its lines. */
export interface StockReceipt extends StockReceiptRow {
  items: StockReceiptItem[]
}

export interface StockReceiptListQuery {
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

/** New accessory (or keypad phone) created inline from a receipt line. */
export interface NewAccessoryInput {
  name: string
  /** Defaults to ACCESSORY on the backend; send KEYPAD_PHONE to create a phone. */
  kind?: AccessoryKind
  /** Free-form IMEI — keypad phones only. */
  imei?: string
  salePrice?: number
  imageUrl?: string
  note?: string
}

/**
 * One line of a create-receipt payload. Exactly ONE of `accessoryId` /
 * `newAccessory` must be set (both or neither → RECEIPT_LINE_INVALID).
 */
export interface CreateStockReceiptLine {
  accessoryId?: string
  newAccessory?: NewAccessoryInput
  quantity: number // positive integer
  purchasePrice: number // >= 0 (0 = tekin/free)
  /**
   * Optional sale price to set on the accessory this intake feeds. For an existing
   * accessory it updates the catalog price; for a new one it also rides inside
   * `newAccessory.salePrice`. Omit to leave the price unchanged.
   */
  salePrice?: number
}

export interface CreateStockReceiptPayload {
  supplierName?: string
  supplierPhone?: string
  note?: string
  items: CreateStockReceiptLine[] // at least 1
}

/* ----------------------------------------------------------------------------
 * Sales
 * ------------------------------------------------------------------------- */

/** MIXED = a single sale that contains more than one product family. */
export type SaleType = 'PHONE' | 'ACCESSORY' | 'KEYPAD_PHONE' | 'MIXED'
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
  /** Customer info recorded for any sale (auto-filled from the debt on debt sales). */
  customerName?: string | null
  customerPhone?: string | null
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
  /** Optional; on a debt sale, backend fills these from the debt customer when omitted. */
  customerName?: string
  customerPhone?: string
}

export interface CreateAccessorySalePayload {
  accessoryId: string
  quantity: number
  unitPrice?: number
  note?: string
  debt?: DebtInput
  /** Optional; on a debt sale, backend fills these from the debt customer when omitted. */
  customerName?: string
  customerPhone?: string
}

/**
 * Cart-style multi-item sale (`POST /sales`). One sale may mix phones and
 * accessories. Each accessory line names the exact FIFO batch (`stockEntryId`)
 * the seller chose to sell from.
 */
export interface CreateSalePhoneLine {
  type: 'PHONE'
  phoneId: string
  unitPrice: number
}
export interface CreateSaleAccessoryLine {
  /** Must match the product's kind: ACCESSORY for accessories, KEYPAD_PHONE for phones. */
  type: 'ACCESSORY' | 'KEYPAD_PHONE'
  accessoryId: string
  stockEntryId: string
  quantity: number
  unitPrice: number
}
export type CreateSaleLine = CreateSalePhoneLine | CreateSaleAccessoryLine

export interface CreateSalePayload {
  items: CreateSaleLine[] // at least 1
  note?: string
  /** Optional; on a debt sale, backend fills these from the debt customer when omitted. */
  customerName?: string
  customerPhone?: string
  debt?: DebtInput
}

export interface UpdateSaleItemInput {
  id: string
  unitPrice: number
}

/**
 * Correct the sale prices of a completed sale (`PATCH /sales/:id`). Only the
 * lines whose price changed need to be sent; the rest keep their price. Cost
 * price is never touched — the server recomputes total/paid/profit.
 *
 * ⚠️ `debt` MUST be re-sent for a sale that already carries a debt: omitting it
 * (or sending `null`) converts the sale to full cash and clears the debt.
 */
export interface UpdateSalePayload {
  items: UpdateSaleItemInput[]
  debt?: DebtInput | null
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
  /** ACCESSORY only — keypad phones are broken out into `keypadPhones`. */
  accessories: AccessoryStats
  /** Klaviaturali telefonlar — same shape as accessories (may be absent on older backends). */
  keypadPhones?: AccessoryStats
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
