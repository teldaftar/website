import { computed, ref } from 'vue'
import type { Accessory, CreateSaleLine, Phone, StockEntry } from '@/api/types'

/**
 * Local cart state for the multi-item sale flow (NewSaleView). Each line is one
 * product row: a phone (qty always 1) or an accessory. An accessory is shown as a
 * SINGLE row even when its stock spans several FIFO batches — the requested
 * quantity is split across those batches (oldest first) only at submit time, so
 * the same accessory never appears twice just because it has two intakes.
 */
export interface PhoneCartLine {
  key: number
  type: 'PHONE'
  phone: Phone
  unitPrice: number | null
}

export interface AccessoryCartLine {
  key: number
  type: 'ACCESSORY'
  accessory: Accessory
  /** Available FIFO batches (oldest first) — quantity is split across these on submit. */
  batches: StockEntry[]
  quantity: number
  unitPrice: number | null
}

export type CartLine = PhoneCartLine | AccessoryCartLine

/** Total units still sellable for an accessory line (sum across its batches). */
export function accessoryAvailable(line: AccessoryCartLine): number {
  return line.batches.reduce((sum, b) => sum + b.remainingQuantity, 0)
}

/** Line subtotal (phone = its price; accessory = price × quantity). */
export function lineTotal(line: CartLine): number {
  const price = line.unitPrice ?? 0
  return line.type === 'PHONE' ? price : price * line.quantity
}

export function useSaleCart() {
  const lines = ref<CartLine[]>([])
  let seq = 0

  const total = computed(() => lines.value.reduce((sum, l) => sum + lineTotal(l), 0))
  const isEmpty = computed(() => lines.value.length === 0)

  function hasPhone(phoneId: string): boolean {
    return lines.value.some((l) => l.type === 'PHONE' && l.phone.id === phoneId)
  }
  function hasAccessory(accessoryId: string): boolean {
    return lines.value.some((l) => l.type === 'ACCESSORY' && l.accessory.id === accessoryId)
  }

  function addPhone(phone: Phone) {
    if (hasPhone(phone.id)) return false
    lines.value.push({ key: ++seq, type: 'PHONE', phone, unitPrice: phone.listPrice ?? null })
    return true
  }

  function addAccessory(accessory: Accessory, batches: StockEntry[]) {
    if (hasAccessory(accessory.id) || batches.length === 0) return false
    lines.value.push({
      key: ++seq,
      type: 'ACCESSORY',
      accessory,
      batches,
      quantity: 1,
      unitPrice: accessory.salePrice ?? null,
    })
    return true
  }

  function remove(key: number) {
    lines.value = lines.value.filter((l) => l.key !== key)
  }

  function clear() {
    lines.value = []
  }

  /** Every line needs a positive price; accessory qty must fit its total available. */
  const linesValid = computed(
    () =>
      lines.value.length > 0 &&
      lines.value.every(
        (l) =>
          l.unitPrice != null &&
          l.unitPrice > 0 &&
          (l.type === 'PHONE' || (l.quantity >= 1 && l.quantity <= accessoryAvailable(l))),
      ),
  )

  /**
   * Flatten to backend lines. An accessory line spanning multiple batches becomes
   * several ACCESSORY items (one per batch consumed, FIFO), all at the same price.
   */
  function toPayloadItems(): CreateSaleLine[] {
    return lines.value.flatMap((l) => {
      if (l.type === 'PHONE') {
        return [{ type: 'PHONE', phoneId: l.phone.id, unitPrice: l.unitPrice as number }]
      }
      const out: CreateSaleLine[] = []
      let remaining = l.quantity
      for (const batch of l.batches) {
        if (remaining <= 0) break
        const take = Math.min(remaining, batch.remainingQuantity)
        if (take <= 0) continue
        out.push({
          type: 'ACCESSORY',
          accessoryId: l.accessory.id,
          stockEntryId: batch.id,
          quantity: take,
          unitPrice: l.unitPrice as number,
        })
        remaining -= take
      }
      return out
    })
  }

  return {
    lines,
    total,
    isEmpty,
    linesValid,
    hasPhone,
    hasAccessory,
    addPhone,
    addAccessory,
    remove,
    clear,
    toPayloadItems,
  }
}
