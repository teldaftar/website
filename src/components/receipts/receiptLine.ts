import type {
  Accessory,
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
  /** Display snapshot. */
  name: string
  imageUrl: string | null
  /** Current catalog quantity (existing rows only) — shown for reference. */
  currentQuantity: number | null
  /** Editable. */
  quantity: string
  purchasePrice: number | null
}

export function rowFromAccessory(key: number, acc: Accessory): ReceiptRowState {
  return {
    key,
    accessoryId: acc.id,
    newAccessory: null,
    name: acc.name,
    imageUrl: acc.imageUrl ?? null,
    currentQuantity: acc.quantity,
    quantity: '',
    // Prefill with the accessory's last cost (may be 0 = tekin).
    purchasePrice: acc.purchasePrice,
  }
}

/** Prefill a row from an existing receipt's saved line (edit mode). */
export function rowFromReceiptItem(key: number, item: StockReceiptItem): ReceiptRowState {
  return {
    key,
    accessoryId: item.accessoryId,
    newAccessory: null,
    name: item.name,
    imageUrl: item.imageUrl ?? null,
    currentQuantity: null,
    quantity: String(item.quantity),
    purchasePrice: item.purchasePrice,
  }
}

export function rowFromNew(key: number, input: NewAccessoryInput): ReceiptRowState {
  return {
    key,
    accessoryId: null,
    newAccessory: input,
    name: input.name,
    imageUrl: input.imageUrl ?? null,
    currentQuantity: null,
    quantity: '',
    purchasePrice: null,
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

/** Convert a completed row into the API payload line. */
export function toPayloadLine(r: ReceiptRowState): CreateStockReceiptLine {
  const base = { quantity: rowQty(r), purchasePrice: r.purchasePrice as number }
  return r.accessoryId
    ? { ...base, accessoryId: r.accessoryId }
    : { ...base, newAccessory: r.newAccessory as NewAccessoryInput }
}
