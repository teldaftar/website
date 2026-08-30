/**
 * Idempotency keys make "create" requests safe to retry.
 *
 * A key is generated ONCE per intent (when a phone-add modal opens or a checkout
 * begins) and reused for every retry of that same intent — including automatic
 * network retries and manual "try again" taps. The backend returns the first
 * created row for a repeated key instead of inserting a duplicate, so a lost
 * response never turns into two phones / two sales. A fresh key is minted only
 * after the intent completes (modal closed / cart cleared).
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for the rare environment without crypto.randomUUID (RFC4122 v4).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
