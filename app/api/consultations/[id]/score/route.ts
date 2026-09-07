/**
 * `GET /api/consultations/[id]/score`
 *
 * The IPHMH wellness score for one RMO consultation: section totals, red flags
 * and completeness. Derived from the stored answers on every read, never
 * persisted.
 *
 * Role gating and the READ audit row come from `getConsultation`, so this route
 * stays declarative. Per-question point values are never serialised — that
 * boundary is enforced in `lib/scoring/engine.ts` and asserted by
 * `lib/scoring/__tests__/serialization.test.ts`.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { consultationScoreParamSchema } from "@/lib/validation/scoring"
import { getConsultationScore } from "@/lib/services/consultation-score"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = consultationScoreParamSchema.parse(await params)

  const score = await getConsultationScore(id, {
    userId: session.userId,
    role: session.role,
  })

  return ok(score)
})
