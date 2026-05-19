/**
 * `GET /api/patient/me/invoices` (BE-50).
 *
 * Paginated list of the patient's invoices, with line items + payments
 * inlined so the patient-portal billing view can render in one round-trip.
 * Payment status is implicit in `invoice.status` + the `payments[]`
 * array.
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { listSelfInvoices } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfInvoices({
    patientId,
    actorUserId: userId,
    input: { limit, cursor },
  })

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})
