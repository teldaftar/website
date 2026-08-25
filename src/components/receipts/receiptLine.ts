import type {
  Accessory,
  AccessoryKind,
  CreateStockReceiptLine,
  NewAccessoryInput,
  StockReceiptItem,
} from '@/api/types'

/**
 * One row of the "Yangi kirim" table. A row is either an existing accessory
 * (`accessoryId`) or a brand-new one created inline (`newAccessory`) — never
 * both. Quantity + purchase price are entered per row in the table.
 */
export interface ReceiptRowState {
  /** Stable key for v-for (not sent to the server). */
  key: number
  accessoryId: string | null
  newAccessory: NewAccessoryInput | null
  /** Product family — drives the row's icon/badge (accessory vs keypad phone). */
  kind: AccessoryKind
  /** Display snapshot. */
  name: string
  imageUrl: string | null
  /** Current catalog quantity (existing rows only) — shown for reference. */
  currentQuantity: number | null
  /** Editable. */
  quantity: string
  purchasePrice: number | null
  /** Optional sale price to set on the accessory (auto-fills the sale page later). */
  salePrice: number | null
}

export function rowFromAccessory(key: number, acc: Accessory): ReceiptRowState {
  return {
    key,
    accessoryId: acc.id,
    newAccessory: null,
    kind: acc.kind,
    name: acc.name,
    imageUrl: acc.imageUrl ?? null,
    currentQuantity: acc.quantity,
    quantity: '',
    // Prefill with the accessory's last cost (may be 0 = tekin).
    purchasePrice: acc.purchasePrice,
    // Prefill with the accessory's current sale price; editing it updates the catalog.
    salePrice: acc.salePrice ?? null,
  }
}

/** Prefill a row from an existing receipt's saved line (edit mode). */
export function rowFromReceiptItem(key: number, item: StockReceiptItem): ReceiptRowState {
  return {
    key,
    accessoryId: item.accessoryId,
    newAccessory: null,
    kind: item.kind ?? 'ACCESSORY',
    name: item.name,
    imageUrl: item.imageUrl ?? null,
    currentQuantity: null,
    quantity: String(item.quantity),
    purchasePrice: item.purchasePrice,
    // The saved receipt line carries no sale price — leave blank in edit mode.
    salePrice: null,
  }
}

export function rowFromNew(key: number, input: NewAccessoryInput): ReceiptRowState {
  return {
    key,
    accessoryId: null,
    newAccessory: input,
    kind: input.kind ?? 'ACCESSORY',
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    currentQuantity: null,
    quantity: '',
    purchasePrice: null,
    salePrice: input.salePrice ?? null,
  }
}

/** Parsed positive-integer quantity, or 0 when blank/invalid. */
export function rowQty(r: ReceiptRowState): number {
  const q = Number(r.quantity)
  return r.quantity.trim() !== '' && Number.isInteger(q) && q > 0 ? q : 0
}

/** Row subtotal (quantity × purchasePrice) for the running total. */
export function rowSubtotal(r: ReceiptRowState): number {
  return rowQty(r) * (r.purchasePrice ?? 0)
}

/** Mirror of the server rules: is this row ready to submit? */
export function rowComplete(r: ReceiptRowState): boolean {
  if (rowQty(r) < 1) return false
  if (r.purchasePrice == null || r.purchasePrice < 0) return false
  return !!r.accessoryId || !!r.newAccessory
}

/**
 * Convert a completed row into the API payload line. A sale price (when entered)
 * updates the accessory's catalog price: line-level for an existing accessory,
 * or inside `newAccessory.salePrice` for a brand-new one. Omitted → price unchanged.
 */
export function toPayloadLine(r: ReceiptRowState): CreateStockReceiptLine {
  const salePrice = r.salePrice != null && r.salePrice >= 0 ? r.salePrice : undefined
  const base = { quantity: rowQty(r), purchasePrice: r.purchasePrice as number }
  if (r.accessoryId) {
    // Existing product: the backend already knows its kind — don't resend it.
    return { ...base, accessoryId: r.accessoryId, ...(salePrice != null && { salePrice }) }
  }
  // New product: carry the row's kind so the catalog entry is created in the right family.
  return { ...base, newAccessory: { ...(r.newAccessory as NewAccessoryInput), kind: r.kind, salePrice } }
}
