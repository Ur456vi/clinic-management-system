/**
 * `GET /api/patient/me/scores/[id]`
 *
 * Section breakdown of one of the calling patient's own consultation scores.
 *
 * The payload is deliberately thinner than the clinician's: totals and section
 * scores only — no red flags, no completeness, no scoring version, and no
 * per-question detail of any kind.
 *
 * `patientId` from the session is part of the `where` clause, so another
 * patient's consultation id resolves to 404 rather than leaking anything.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { consultationScoreParamSchema } from "@/lib/validation/scoring"
import { getSelfScore } from "@/lib/services/consultation-score"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { patientId } = await requirePatientSession()
  const { id } = consultationScoreParamSchema.parse(await params)

  return ok(await getSelfScore(id, patientId))
})
