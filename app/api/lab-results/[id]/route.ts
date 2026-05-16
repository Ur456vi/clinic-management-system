/**
 * `/api/lab-results/[id]` item routes (BE-16).
 *
 *   GET   — fetch one lab result with patient + ordering-doctor summary
 *           (writes a READ audit row).
 *   PATCH — partial update; replaces `analytes` verbatim after running the
 *           server-side flag-computation helper.
 *
 * Both require an authenticated session. Role gates live in
 * `lib/services/lab-result.ts` — PATCH is restricted to ADMIN / DOCTOR /
 * RMO; GET is open to any authenticated clinic role.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  labResultIdParamSchema,
  updateLabResultSchema,
} from "@/lib/validation/lab-result"
import {
  getLabResult,
  updateLabResult,
} from "@/lib/services/lab-result"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const labResult = await getLabResult(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(labResult)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const body = updateLabResultSchema.parse(await req.json())
  const labResult = await updateLabResult(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(labResult)
})
