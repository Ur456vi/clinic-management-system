/**
 * `/api/refills` collection routes.
 *
 *   GET  — list refill requests (staff queue; cursor-paginated, filterable
 *          by `patientId` + `status`).
 *   POST — create a refill request on a patient's behalf.
 *
 * Both require an authenticated session; the service layer enforces the
 * role gates (WRITE_ROLES for POST, READ_ROLES for GET), the patient /
 * plan-item checks, and the audit-log writes.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createRefillRequestSchema,
  listRefillRequestsQuerySchema,
} from "@/lib/validation/refill-request"
import {
  createRefillRequest,
  listRefillRequests,
} from "@/lib/services/refill-request"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listRefillRequestsQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    status: sp.get("status") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listRefillRequests(query, {
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
  const body = createRefillRequestSchema.parse(await req.json())
  const row = await createRefillRequest(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(row, `/api/refills/${row.id}`)
})
