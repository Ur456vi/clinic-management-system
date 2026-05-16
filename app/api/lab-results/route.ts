/**
 * `/api/lab-results` collection routes (BE-16).
 *
 *   GET  — list lab results for a patient or consultation (paginated).
 *   POST — create a new lab result.
 *
 * Listing requires either `patientId` or `consultationId` in the query
 * string; the validator's `.refine` rejects calls with neither (400).
 *
 * Both endpoints require an authenticated session. Role gates live in
 * `lib/services/lab-result.ts` — POST is restricted to ADMIN / DOCTOR /
 * RMO; GET is open to any authenticated clinic role.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createLabResultSchema,
  listLabResultsQuerySchema,
} from "@/lib/validation/lab-result"
import {
  createLabResult,
  listLabResults,
} from "@/lib/services/lab-result"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listLabResultsQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    consultationId: sp.get("consultationId") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listLabResults(query, {
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
  const body = createLabResultSchema.parse(await req.json())
  const labResult = await createLabResult(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(labResult, `/api/lab-results/${labResult.id}`)
})
