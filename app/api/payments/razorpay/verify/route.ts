/**
 * `POST /api/payments/razorpay/verify` (BE-41 — mock).
 *
 * Razorpay's checkout-success handshake: the browser receives
 * `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`
 * from the Razorpay widget and POSTs them straight here. We re-derive
 * the signature with `RAZORPAY_KEY_SECRET` and only book the payment
 * if it matches.
 *
 * On a valid signature, this hands off to `recordPayment` from the
 * BE-37 invoice service — same code path as the desk-clerk cash
 * receipt, just with `method = RAZORPAY` + the gateway payment id.
 * On signature mismatch, we return `400 INVALID_SIGNATURE` so the FE
 * can surface a "payment couldn't be verified, please contact
 * reception" message without raising a 500 alarm.
 */

import { PaymentMethod, PaymentStatus } from "@prisma/client"

import {
  ConflictError,
  defineHandler,
  NotFoundError,
  ValidationError,
  ok,
  requireSession,
} from "@/lib/api"
import { db } from "@/lib/db"
import { recordPayment } from "@/lib/services/invoice"
import { verifyMockSignature } from "@/lib/services/razorpay"
import { verifyPaymentSchema } from "@/lib/validation/payment"

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = verifyPaymentSchema.parse(await req.json())

  const isValid = verifyMockSignature(
    body.razorpayOrderId,
    body.razorpayPaymentId,
    body.razorpaySignature,
  )
  if (!isValid) {
    throw new ValidationError("Razorpay signature mismatch", {
      code: "INVALID_SIGNATURE",
    })
  }

  const invoice = await db.invoice.findUnique({
    where: { id: body.invoiceId },
    include: { payments: true },
  })
  if (!invoice) throw new NotFoundError("Invoice not found")

  // Idempotency — if this gateway payment id has already been booked
  // (e.g. the webhook beat the redirect), short-circuit with the
  // current invoice state instead of double-charging the row.
  const existing = invoice.payments.find(
    (p) => p.gatewayRef === body.razorpayPaymentId,
  )
  if (existing) {
    return ok({
      invoice,
      paymentId: existing.id,
      alreadyRecorded: true,
    })
  }

  if (invoice.status === "VOID") {
    throw new ConflictError("Cannot pay a VOID invoice", {
      code: "INVOICE_VOID",
    })
  }

  const capturedCents = invoice.payments
    .filter((p) => p.status === PaymentStatus.CAPTURED)
    .reduce((acc, p) => acc + p.amountCents, 0)
  const remainingCents = invoice.totalCents - capturedCents
  if (remainingCents <= 0) {
    throw new ConflictError("Invoice has no remaining balance", {
      code: "INVOICE_FULLY_PAID",
    })
  }

  const result = await recordPayment(
    body.invoiceId,
    {
      amountCents: remainingCents,
      method: PaymentMethod.RAZORPAY,
      status: PaymentStatus.CAPTURED,
      gatewayRef: body.razorpayPaymentId,
    },
    { userId: session.userId, role: session.role },
  )

  return ok({
    invoice: result.invoice,
    paymentId: result.paymentId,
    alreadyRecorded: false,
  })
})
