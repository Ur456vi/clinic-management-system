/**
 * Zod schemas for the Razorpay (mock) payment surface (BE-41).
 *
 * Exports:
 *   - `createOrderSchema`       — POST /api/payments/razorpay/order
 *   - `verifyPaymentSchema`     — POST /api/payments/razorpay/verify
 *   - `webhookPayloadSchema`    — POST /api/payments/razorpay/webhook
 *
 * Sprint 1 ships against a mock — no real Razorpay SDK, no live keys.
 * The shape mirrors what the real `razorpay` Node SDK emits so the BE-41
 * route bodies will not have to change in Sprint 2 when we wire the real
 * gateway. `PaymentMethod` / `PaymentStatus` come straight from Prisma so
 * the service layer never sees a mismatched enum value.
 */

import { z } from "zod"
import { PaymentStatus } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const nonEmptyString = (max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max)

// ---------------------------------------------------------------------------
// POST /api/payments/razorpay/order
// ---------------------------------------------------------------------------

export const createOrderSchema = z.object({
  invoiceId: uuid,
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// ---------------------------------------------------------------------------
// POST /api/payments/razorpay/verify
// ---------------------------------------------------------------------------

/**
 * Razorpay's checkout-success handshake. The browser receives
 * `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`
 * from the checkout widget and POSTs them straight here. We re-derive
 * the signature server-side and only book the payment if it matches.
 */
export const verifyPaymentSchema = z.object({
  invoiceId: uuid,
  razorpayOrderId: nonEmptyString(120, "razorpayOrderId"),
  razorpayPaymentId: nonEmptyString(120, "razorpayPaymentId"),
  razorpaySignature: nonEmptyString(256, "razorpaySignature"),
})

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>

// ---------------------------------------------------------------------------
// POST /api/payments/razorpay/webhook
// ---------------------------------------------------------------------------

/**
 * Razorpay webhook envelope (mock subset). We only consume the fields
 * we need to upsert a Payment row; everything else passes through
 * untouched. The real Razorpay payload carries many more nested keys —
 * extending this schema later is non-breaking because Zod ignores
 * unknown properties by default.
 */
export const webhookPayloadSchema = z.object({
  event: z.string().trim().min(1).max(120),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: nonEmptyString(120, "payment.entity.id"),
        order_id: nonEmptyString(120, "payment.entity.order_id"),
        status: z.string().trim().min(1).max(40),
        amount: z.number().int().nonnegative(),
        currency: z.string().trim().min(3).max(8).default("INR"),
        notes: z
          .object({
            invoiceId: uuid.optional(),
          })
          .partial()
          .optional(),
      }),
    }),
  }),
})

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>

/**
 * Razorpay's checkout `status` strings -> our `PaymentStatus` enum.
 * Anything outside this map falls through to PENDING so the row still
 * lands and a human can investigate.
 */
export const RAZORPAY_STATUS_MAP: Record<string, PaymentStatus> = {
  captured: PaymentStatus.CAPTURED,
  authorized: PaymentStatus.PENDING,
  created: PaymentStatus.PENDING,
  failed: PaymentStatus.FAILED,
  refunded: PaymentStatus.REFUNDED,
}
