/**
 * `/api/patient/me/refills` (patient self-service).
 *
 *   GET  — the calling patient's own refill requests (newest first).
 *   POST — raise a new refill request for the calling patient.
 *
 * The `patientId` is resolved from `requirePatientSession()` and used as a
 * hard-pinned filter — never read from the request body. Mirrors the other
 * `/api/patient/me/*` self routes.
 */

import { NextResponse } from "next/server"

import {
  created,
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { createSelfRefillRequestSchema } from "@/lib/validation/refill-request"
import {
  createSelfRefillRequest,
  listSelfRefillRequests,
} from "@/lib/services/refill-request"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfRefillRequests({
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

export const POST = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const body = createSelfRefillRequestSchema.parse(await req.json())
  const row = await createSelfRefillRequest({
    patientId,
    actorUserId: userId,
    input: body,
  })
  return created(row, `/api/refills/${row.id}`)
})
