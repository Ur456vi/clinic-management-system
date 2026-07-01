/**
 * `GET /api/patient/me/clinical-summaries`
 *
 * Lists the calling patient's own clinical summaries (newest first). The
 * doctor / RMO uploads these from the admin side; the patient is read-only.
 * PATIENT-role only, ownership-pinned.
 */

import { defineHandler, paginated, requirePatientSession } from "@/lib/api"
import { listSelfClinicalSummaries } from "@/lib/services/patient-self"

export const GET = defineHandler(async ({ req }) => {
  const { userId, patientId } = await requirePatientSession()
  const sp = new URL(req.url).searchParams
  const limitRaw = sp.get("limit")
  const limit = limitRaw ? Number(limitRaw) : undefined
  const cursor = sp.get("cursor") ?? undefined

  const { items, nextCursor } = await listSelfClinicalSummaries({
    patientId,
    actorUserId: userId,
    input: { limit, cursor },
  })

  return paginated(items, { next: nextCursor })
})
