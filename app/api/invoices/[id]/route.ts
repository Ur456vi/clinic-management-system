/**
 * `/api/invoices/[id]` item routes (BE-37).
 *
 *   GET   — fetch one invoice with its items + payments (READ audit row).
 *   PATCH — update status (gated by ALLOWED_INVOICE_TRANSITIONS) and/or
 *           notes. Payment-driven status changes (PARTIALLY_PAID / PAID)
 *           normally come through `recordPayment`; the manual transition
 *           is retained for the May-28 demo's "mark paid" cash flow.
 *
 * Both require an authenticated session; role gates and audit writes
 * live in `lib/services/invoice.ts`.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  invoiceIdParamSchema,
  updateInvoiceSchema,
} from "@/lib/validation/invoice"
import {
  getInvoice,
  updateInvoiceStatus,
} from "@/lib/services/invoice"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = invoiceIdParamSchema.parse(await params)
  const invoice = await getInvoice(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(invoice)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = invoiceIdParamSchema.parse(await params)
  const body = updateInvoiceSchema.parse(await req.json())
  const invoice = await updateInvoiceStatus(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(invoice)
})
