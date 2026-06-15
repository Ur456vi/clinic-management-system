/**
 * `GET /api/patient/me/prescriptions`
 *
 * The calling patient's prescriptions, derived from the Dr. Yuvraaj MAIN
 * consultations' Final Prescription. Newest first. Shaped so the portal
 * Prescriptions page can list, open, and print them. The `patientId` is
 * resolved from `requirePatientSession()` — never the query string.
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  parsePagination,
  requirePatientSession,
} from "@/lib/api"
import { listSelfPrescriptions } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = req.nextUrl.searchParams
  const { take, cursor } = parsePagination(sp)
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : take

  const { items, nextCursor } = await listSelfPrescriptions({
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
