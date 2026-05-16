/**
 * `/api/invoices/[id]/payments` — POST a payment against an invoice.
 *
 * Records a Payment row and re-derives the parent invoice's status from
 * the running sum of CAPTURED payments. See `recordPayment` in
 * `lib/services/invoice.ts` for the math.
 *
 * The Razorpay webhook (BE-41) will end up calling the same service
 * function with `method = RAZORPAY` + a `gatewayRef`; this route is the
 * desk-clerk surface for cash / card / UPI receipts.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  invoiceIdParamSchema,
  recordPaymentSchema,
} from "@/lib/validation/invoice"
import { recordPayment } from "@/lib/services/invoice"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = invoiceIdParamSchema.parse(await params)
  const body = recordPaymentSchema.parse(await req.json())
  const { invoice, paymentId } = await recordPayment(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ invoice, paymentId })
})
