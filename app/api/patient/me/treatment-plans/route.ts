/**
 * `GET /api/patient/me/treatment-plans` (BE-50).
 *
 * Paginated list of the patient's treatment plans. DRAFT plans are
 * intentionally hidden — patients only see SIGNED + REVOKED rows. See
 * `lib/services/patient-self.ts` for the status filter.
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { listSelfTreatmentPlans } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfTreatmentPlans({
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
