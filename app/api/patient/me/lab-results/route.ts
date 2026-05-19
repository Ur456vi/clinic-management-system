/**
 * `GET /api/patient/me/lab-results` (BE-50).
 *
 * Paginated list of the patient's lab results. `LabResult` has no
 * status enum (see schema.prisma BE-16 comment); finalization is
 * signalled by `reportedAt`. Rows without `reportedAt` are hidden
 * from the patient view.
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { listSelfLabResults } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfLabResults({
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
