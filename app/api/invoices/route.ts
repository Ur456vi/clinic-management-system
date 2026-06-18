/**
 * `/api/invoices` collection routes (BE-37).
 *
 *   GET  — list invoices (cursor-paginated, filterable by patient /
 *          appointment / status).
 *   POST — create a new DRAFT invoice with its items; totals are
 *          computed server-side from `unitPriceCents` × quantity.
 *
 * Both require an authenticated session. The service layer enforces the
 * role gates (WRITE_ROLES for POST, VIEW_ROLES for GET) and the
 * audit-log writes.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
} from "@/lib/validation/invoice"
import {
  createInvoice,
  listInvoices,
} from "@/lib/services/invoice"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listInvoicesQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    appointmentId: sp.get("appointmentId") ?? undefined,
    status: sp.get("status") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listInvoices(query, {
    userId: session.userId,
    role: session.role,
  })

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createInvoiceSchema.parse(await req.json())
  const invoice = await createInvoice(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(invoice, `/api/invoices/${invoice.id}`)
})
