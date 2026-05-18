/**
 * `POST /api/payments/razorpay/order` (BE-41 — mock).
 *
 * Looks up the invoice, computes the remaining balance (total - sum of
 * CAPTURED payments), and returns the order payload the FE-10 checkout
 * widget hands to Razorpay (mock).
 *
 * Sprint 1 ships with a mock — no Razorpay SDK call goes out over the
 * wire. The wire shape is identical to what the real Razorpay SDK
 * returns from `orders.create()`, so the FE doesn't change in Sprint 2.
 */

import { PaymentStatus } from "@prisma/client"

import {
  ConflictError,
  defineHandler,
  NotFoundError,
  ok,
  requireSession,
} from "@/lib/api"
import { db } from "@/lib/db"
import { createMockOrder } from "@/lib/services/razorpay"
import { createOrderSchema } from "@/lib/validation/payment"

export const POST = defineHandler(async ({ req }) => {
  await requireSession()
  const { invoiceId } = createOrderSchema.parse(await req.json())

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  })
  if (!invoice) throw new NotFoundError("Invoice not found")

  if (invoice.status === "PAID") {
    throw new ConflictError("Invoice is already PAID", {
      code: "INVOICE_ALREADY_PAID",
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

  const order = createMockOrder(invoice.id, remainingCents)

  return ok({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    remainingCents,
    ...order,
  })
})
