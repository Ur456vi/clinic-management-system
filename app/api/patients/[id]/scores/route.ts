/**
 * `GET /api/patients/[id]/scores?limit=10`
 *
 * Newest-first IPHMH score history for one patient — one entry per RMO
 * consultation, with the change against the previous visit.
 *
 * `delta` is null whenever the two consultations have different denominators
 * (a gendered section became applicable, say). Raw totals are not comparable
 * across different maxima, so the UI must fall back to percentages there.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  patientScoresParamSchema,
  scoreHistoryQuerySchema,
} from "@/lib/validation/scoring"
import { listPatientScores } from "@/lib/services/consultation-score"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = patientScoresParamSchema.parse(await params)
  const { limit } = scoreHistoryQuerySchema.parse({
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  const history = await listPatientScores(
    id,
    { userId: session.userId, role: session.role },
    limit,
  )

  return ok(history)
})
