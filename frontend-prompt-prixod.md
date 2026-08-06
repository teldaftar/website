# Frontend Prompt — Kirim / Prixod (incremental)

> Paste this into the **existing** frontend project's Claude Code. The app is already built and running against the NestJS backend. This is an **incremental change** — reuse everything that's already there (axios instance, TanStack Query, the error-code map, `formatMoney()`, Uzbek i18n dictionary, shared components, light/dark theme, motion). Do **not** rebuild anything. First confirm the plan, then build step by step. The updated `openapi.json` is at the repo root; Swagger at `http://localhost:3000/api/docs`.

---

## What changed on the backend

Two things:

1. **New feature — grouped accessory intake ("Kirim / Prixod").** Previously stock came in one accessory at a time (`POST /accessories/:id/stock`). Now there's a **document-level intake**: one receipt covers many accessory lines at once, can **create brand-new accessories inline**, and records a supplier + totals. The old single add-stock endpoint still exists and stays where it is (quick restock from an accessory's detail page) — this new screen is the bulk/document flow.

2. **Purchase price can now be 0** (free intake — tovar tekinga kelishi mumkin) for phones and accessories. Any form that enters a `purchasePrice` must allow `0`.

---

## 1. New API surface — Stock receipts

All under the existing auth (Bearer token, same interceptor). Base: `/stock-receipts`.

### `GET /stock-receipts` — list (paginated)
Query: `search` (matches code or supplier name), `from`, `to` (local `YYYY-MM-DD`, inclusive), `page`, `limit`.
Returns the standard `{ data, meta }` paginated shape. Each row:
```ts
{
  id: string
  code: string            // "P-000123"
  supplierName: string | null
  supplierPhone: string | null
  totalAmount: number     // sum of all line totals (UZS)
  totalQty: number        // sum of all quantities
  itemCount: number       // number of lines
  note: string | null
  receivedAt: string      // ISO datetime
}
```

### `GET /stock-receipts/:id` — one receipt with its lines
Same fields as above **plus**:
```ts
items: {
  id: string
  accessoryId: string
  name: string            // accessory name (snapshot-friendly)
  imageUrl: string | null
  quantity: number
  purchasePrice: number   // unit cost of this intake (may be 0)
  lineTotal: number       // quantity * purchasePrice
}[]
```

### `POST /stock-receipts` — create a receipt
```ts
{
  supplierName?: string          // optional
  supplierPhone?: string         // optional
  note?: string                  // optional
  items: Array<{
    // EXACTLY ONE of these two per line:
    accessoryId?: string             // restock an EXISTING accessory
    newAccessory?: {                 // OR create a NEW accessory now
      name: string                   // required
      salePrice?: number             // optional default sale price
      imageUrl?: string              // optional (upload first, pass the URL)
      note?: string
    }
    quantity: number                 // positive integer, required
    purchasePrice: number            // number >= 0  (0 = tekin/free)
  }>                                 // at least 1 item
}
```
Returns the created receipt **with `items[]`** (same shape as GET `/:id`). Use it to route straight to the detail screen.

**Validation rules to mirror client-side (but always trust the server `code`):**
- `items` must have **at least 1** line.
- Each line must have **exactly one** of `accessoryId` / `newAccessory`. Both or neither → server returns `RECEIPT_LINE_INVALID`.
- `quantity` — positive integer.
- `purchasePrice` — number ≥ 0 (**0 allowed**), max 2 decimals.
- `newAccessory.name` — required, non-empty.

**Side effects (important for cache):** a successful receipt creates/restocks accessories, appends stock-history entries, and bumps quantities. On success **invalidate**: the accessories lists (`Mavjud` + `Sotilgan`), any open accessory detail/stock-history, the stock-receipts list, and the statistics query. New accessories created inline will appear in the normal accessories list afterwards.

---

## 2. Error-code map — add one entry

Extend the existing `mapErrorCode()` dictionary:

| code | Uzbek message | handling |
|---|---|---|
| `RECEIPT_LINE_INVALID` | Har bir qatorda aniq bitta narsa bo'lishi kerak: mavjud aksessuar yoki yangi aksessuar | inline on the offending row |

(`VALIDATION_FAILED` for empty `items` is already handled by your generic mapper.)

---

## 3. UI — new "Kirim" screen

Add a new top-level nav entry **`Kirim`** (Prixod) — icon `package-plus` or `truck` (lucide). Place it near Aksessuarlar in the nav. Two things live here: the receipts **list** and the **new-receipt** flow.

### 3.1 Receipts list — `Kirimlar`
- `GET /stock-receipts?search&from&to&page&limit`, newest first.
- Search bar (kod yoki postavshik nomi, debounced) + a date-range filter (reuse whatever range control the statistics/sales screens use).
- Each row/card: **`code`** (P-000123), sana (`receivedAt`, formatted), **`totalAmount`** as the hero money figure (`formatMoney`), `totalQty` ("120 dona"), `itemCount` ("2 xil tovar"), and `supplierName` if present. Empty/loading/error states like every other list. Infinite scroll on mobile, pagination on desktop (match existing lists).
- **FAB → `Yangi kirim`** opens the create flow (§3.3).
- Tap a row → detail (§3.2).

### 3.2 Receipt detail — `Kirim #P-000123`
- `GET /stock-receipts/:id`.
- Header: code, sana, postavshik (name + phone if present), note, and the totals (`totalAmount`, `totalQty`, `itemCount`) as clear stat figures.
- **Lines list**: for each item — image (or placeholder), name, `quantity` ("20 ta"), `purchasePrice` (olingan narx; if 0 show a subtle **"Tekin"** badge instead of `0 so'm`), and `lineTotal`. Sum at the bottom equals `totalAmount`.
- No edit/delete for receipts (backend doesn't support it) — don't show those actions. If the user needs a correction, they adjust the accessory directly. You may add a small info note explaining this.

### 3.3 New receipt flow — `Yangi kirim` (the main piece)
Bottom-sheet on mobile / centered dialog (or dedicated page, your call — a full page is fine given it's a multi-row editor) with:

**a) Header fields (all optional):** `supplierName`, `supplierPhone` (validate `998XXXXXXXXX` like elsewhere but optional), `note`.

**b) Line editor** — a repeatable list of rows; start with one empty row, `+ Qator qo'shish` to add more, remove per row (can't remove the last). Each row has a mode toggle:

- **Mavjud aksessuar** (default): a searchable accessory picker (`GET /accessories?search`) that shows each option's **current quantity** so the user knows what they're restocking. Selecting sets `accessoryId`.
- **Yangi aksessuar**: reveals inline fields — `name` (required), optional `salePrice`, optional image (reuse the existing image-upload component → pass the returned `imageUrl`), optional `note`. This sends `newAccessory` instead of `accessoryId`. Explain in one line: *"Yangi aksessuar katalogga qo'shiladi va keyingi kirimlarda ro'yxatда chiqadi."*

In **both** modes the row also has: **`quantity`** (positive integer) and **`purchasePrice`** (olingan narx; **0 ga ruxsat** — allow free intake, show a "0 = tekin" hint).

**c) Running total:** live-compute and show `Σ quantity` and `Σ (quantity × purchasePrice)` at the bottom as the user edits — this is the same money the backend will store as `totalAmount`.

**d) Save → `POST /stock-receipts`.** On success: success toast, invalidate the caches listed in §1, and navigate to the new receipt's detail (§3.2). On `RECEIPT_LINE_INVALID` highlight the bad row. Disable Save while a row is incomplete (no accessory chosen / no new-accessory name / quantity < 1) — mirror the server rules for instant feedback.

Keep the interaction snappy and mobile-friendly (the shopkeeper enters a delivery standing at the counter): big tap targets, quick add-row, keyboard-friendly number inputs, honor `prefers-reduced-motion`.

---

## 4. Free purchase price (0) — small global change

Everywhere a `purchasePrice` is entered, **allow 0** (it was previously required to be positive). Update the zod/vee-validate schemas from "positive" to "min 0" (integers/decimals still, max 2 decimals):

- Phone create/edit — `purchasePrice`
- Accessory create/edit — `purchasePrice`
- Accessory add-stock (`POST /accessories/:id/stock`) — `purchasePrice`
- New receipt line — `purchasePrice`

Add a subtle hint near these fields: **"0 = tekin"**. Where a purchase price of 0 is later displayed (accessory cost, sale line `costPrice`, receipt line), render **"Tekin"** instead of `0 so'm` so it reads intentionally. Sale/list prices remain positive — don't touch those.

---

## 5. Build order

1. **Types + API layer:** regenerate `schema.d.ts` from the updated `openapi.json` (or hand-add the stock-receipt DTOs). Add a `stockReceipts` api module + TanStack Query hooks (`useStockReceipts`, `useStockReceipt`, `useCreateStockReceipt`) with the cache-invalidation from §1.
2. **Error map + zod:** add `RECEIPT_LINE_INVALID`; relax all four `purchasePrice` schemas to min 0; add the "0 = tekin" / "Tekin" rendering helper.
3. **Kirim list + detail** screens (read-only) behind the new nav entry.
4. **Yangi kirim** create flow (the line editor) — the main work.
5. Polish: empty/loading/error states, animations, "Tekin" badges, verify cache invalidation refreshes Aksessuarlar and Statistika after a receipt.

Do not add anything not backed by an endpoint above. Keep it simple and consistent with the rest of the app.
