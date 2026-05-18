/**
 * Razorpay (mock) service layer (BE-41).
 *
 * Sprint 1 ships a **mock** Razorpay integration so the May-28 demo can
 * walk end-to-end through `invoice -> pay` without a live Razorpay
 * account. Real keys + the official `razorpay` Node SDK land in Sprint 2.
 *
 * Surface:
 *   - `createMockOrder(invoiceId, amountCents)`        — order payload
 *     consumed by the FE-10 checkout widget. IDs are deterministic-ish
 *     (`order_mock_<8-hex>`) so logs are easy to grep.
 *   - `verifyMockSignature(orderId, paymentId, sig)`   — HMAC-SHA256 of
 *     `${orderId}|${paymentId}` with `RAZORPAY_KEY_SECRET`. Matches the
 *     real Razorpay checkout-success handshake.
 *   - `verifyWebhookSignature(rawBody, sig)`           — HMAC-SHA256 of
 *     the raw request body with `RAZORPAY_WEBHOOK_SECRET`. Mirrors the
 *     real Razorpay `x-razorpay-signature` semantics.
 *   - `buildMockWebhookPayload(orderId, paymentId, status)` — used by
 *     the FE-10 mock + tests to POST a Razorpay-shaped event against
 *     `/api/payments/razorpay/webhook`.
 *
 * Everything in here is a pure function — no DB, no Next.js, no Prisma.
 * The route handlers thread the results into `recordPayment` /
 * `getInvoice` from `lib/services/invoice.ts`.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto"

// ---------------------------------------------------------------------------
// Env accessors — fall back to the documented mock defaults in Sprint 1
// so local dev + the demo don't need .env.local edits.
// ---------------------------------------------------------------------------

/** Mock default — overridden by the real key id in Sprint 2. */
const DEFAULT_KEY_ID = "rzp_test_mock_key"

/** Mock default — overridden by `RAZORPAY_KEY_SECRET` if set. */
const DEFAULT_KEY_SECRET = "mock-secret"

/** Mock default — overridden by `RAZORPAY_WEBHOOK_SECRET` if set. */
const DEFAULT_WEBHOOK_SECRET = "mock-webhook-secret"

function keyId(): string {
  const v = process.env.RAZORPAY_KEY_ID
  return v && v.length > 0 ? v : DEFAULT_KEY_ID
}

function keySecret(): string {
  const v = process.env.RAZORPAY_KEY_SECRET
  return v && v.length > 0 ? v : DEFAULT_KEY_SECRET
}

function webhookSecret(): string {
  const v = process.env.RAZORPAY_WEBHOOK_SECRET
  return v && v.length > 0 ? v : DEFAULT_WEBHOOK_SECRET
}

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

export type MockOrder = {
  razorpayOrderId: string
  razorpayKeyId: string
  amountCents: number
  currency: "INR"
}

/**
 * Produce a deterministic-ish order id: 8 hex chars derived from a
 * SHA-256 of `<invoiceId>|<amountCents>|<timestamp>`. Two calls in the
 * same millisecond with the same args will still collide — that's fine
 * for a mock; the real Razorpay SDK will give us globally-unique ids.
 */
function newOrderId(invoiceId: string, amountCents: number): string {
  const seed = `${invoiceId}|${amountCents}|${Date.now()}|${randomBytes(4).toString("hex")}`
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 8)
  return `order_mock_${hex}`
}

/**
 * Build the order payload the FE-10 checkout widget expects. Does NOT
 * touch the DB — the route handler is responsible for invoice lookup +
 * remaining-balance math.
 */
export function createMockOrder(
  invoiceId: string,
  amountCents: number,
): MockOrder {
  if (!invoiceId || invoiceId.length === 0) {
    throw new Error("createMockOrder: invoiceId is required")
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(
      "createMockOrder: amountCents must be a positive integer (cents)",
    )
  }
  return {
    razorpayOrderId: newOrderId(invoiceId, amountCents),
    razorpayKeyId: keyId(),
    amountCents,
    currency: "INR",
  }
}

// ---------------------------------------------------------------------------
// Signature helpers
// ---------------------------------------------------------------------------

/** Hex-HMAC-SHA256 of `message` with `secret`. */
function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex")
}

/**
 * Constant-time hex comparison. Returns false on length mismatch
 * instead of throwing — callers treat that as "bad signature" anyway.
 */
function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  } catch {
    return false
  }
}

/**
 * Verify the checkout-success signature. Razorpay's real algorithm is:
 *
 *   sig = HMAC_SHA256(`${order_id}|${payment_id}`, KEY_SECRET)
 *
 * We use the same shape so the FE-10 mock + real Razorpay can share
 * verification code.
 */
export function verifyMockSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!orderId || !paymentId || !signature) return false
  const expected = hmacHex(keySecret(), `${orderId}|${paymentId}`)
  return safeEqualHex(expected, signature)
}

/**
 * Sign a `${orderId}|${paymentId}` pair. Exposed for the FE-10 mock and
 * for tests — production code only verifies, never signs.
 */
export function signMockCheckout(orderId: string, paymentId: string): string {
  return hmacHex(keySecret(), `${orderId}|${paymentId}`)
}

/**
 * Verify the webhook `x-razorpay-signature` header against a raw body.
 * Razorpay signs the entire raw request body with the *webhook* secret
 * (distinct from the checkout key secret).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
): boolean {
  if (!signature) return false
  const expected = hmacHex(webhookSecret(), rawBody)
  return safeEqualHex(expected, signature)
}

/** Sign a raw webhook body — exposed for the mock + tests. */
export function signWebhookBody(rawBody: string): string {
  return hmacHex(webhookSecret(), rawBody)
}

// ---------------------------------------------------------------------------
// Webhook payload builder
// ---------------------------------------------------------------------------

/**
 * The subset of Razorpay's `payment.captured` / `payment.failed`
 * webhook payload we accept. Matches `webhookPayloadSchema` in
 * `lib/validation/payment.ts`.
 */
export type MockWebhookPayload = {
  event: string
  payload: {
    payment: {
      entity: {
        id: string
        order_id: string
        status: string
        amount: number
        currency: "INR"
        notes?: { invoiceId?: string }
      }
    }
  }
}

/**
 * Build a Razorpay-shaped webhook payload. The FE-10 mock and the
 * upcoming integration tests both POST the result of this against
 * `/api/payments/razorpay/webhook`.
 */
export function buildMockWebhookPayload(
  orderId: string,
  paymentId: string,
  status: string,
  opts: { amountCents?: number; invoiceId?: string } = {},
): MockWebhookPayload {
  const eventName =
    status === "captured"
      ? "payment.captured"
      : status === "failed"
        ? "payment.failed"
        : status === "refunded"
          ? "payment.refunded"
          : `payment.${status}`
  return {
    event: eventName,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          status,
          amount: opts.amountCents ?? 0,
          currency: "INR",
          ...(opts.invoiceId ? { notes: { invoiceId: opts.invoiceId } } : {}),
        },
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------

/**
 * Generate a mock payment id (`pay_mock_<10-hex>`). Used by the FE-10
 * mock when it needs to simulate Razorpay assigning a payment id on
 * the way back from checkout.
 */
export function newMockPaymentId(): string {
  return `pay_mock_${randomBytes(5).toString("hex")}`
}
