/**
 * `/api/lab-results` collection routes (BE-16).
 *
 *   GET  — list lab results (paginated; optional `patientId` and `panel`
 *          filters). Excludes soft-deleted rows.
 *   POST — create a new lab result; flag fields are computed server-side.
 *
 * Both require an authenticated session. Role gates live in the service
 * layer (`@/lib/services/lab-result`). Reference-range engine is BE-18;
 * S3 attachment pipeline is BE-19/20.
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
    panel: sp.get("panel") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    take: sp.get("take") ?? undefined,
  })

  const { items, nextCursor } = await listLabResults(query, {
    role: session.role,
  })

  return NextResponse.json({
    data: items,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createLabResultSchema.parse(await req.json())
  const result = await createLabResult(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(result, `/api/lab-results/${result.id}`)
})
