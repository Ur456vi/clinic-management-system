/**
 * `GET /api/patient/me/scores?limit=10`
 *
 * The calling patient's own IPHMH score history, newest first. PATIENT-role
 * only, ownership-pinned: `patientId` comes from `requirePatientSession()` and
 * is never read from the query string.
 *
 * Drafts are excluded, and so is any consultation below the completeness
 * threshold — a thin assessment showing a low number in a self-service portal,
 * with no clinician present to explain it, is worse than showing nothing.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { scoreHistoryQuerySchema } from "@/lib/validation/scoring"
import { listSelfScores } from "@/lib/services/consultation-score"

export const GET = defineHandler(async ({ req }) => {
  const { patientId } = await requirePatientSession()
  const { limit } = scoreHistoryQuerySchema.parse({
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  return ok(await listSelfScores(patientId, limit))
})
