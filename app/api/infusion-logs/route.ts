/**
 * `/api/infusion-logs` collection routes (BE-26).
 *
 *   GET  — list infusion logs (cursor-paginated, filterable).
 *   POST — create a new SCHEDULED infusion log.
 *
 * Both require an authenticated session. The service layer enforces the
 * role gates (WRITE_ROLES for POST, READ_ROLES for GET), the
 * patient/consultation/staff existence checks, and the audit-log writes.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createInfusionLogSchema,
  listInfusionLogsQuerySchema,
} from "@/lib/validation/infusion-log"
import {
  createInfusionLog,
  listInfusionLogs,
} from "@/lib/services/infusion-log"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listInfusionLogsQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    staffId: sp.get("staffId") ?? undefined,
    status: sp.get("status") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listInfusionLogs(query, {
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
  const body = createInfusionLogSchema.parse(await req.json())
  const log = await createInfusionLog(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(log, `/api/infusion-logs/${log.id}`)
})
