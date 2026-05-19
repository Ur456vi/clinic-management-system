/**
 * `GET /api/patient/me/appointments` (BE-50).
 *
 * Paginated list of the calling patient's appointments. The `patientId`
 * filter is hard-pinned to the resolved patient — query-string overrides
 * are ignored.
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { listSelfAppointments } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  // Accept the BE-12 `limit` alias used by other list endpoints in
  // addition to the cursor helper's `take`.
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfAppointments({
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
