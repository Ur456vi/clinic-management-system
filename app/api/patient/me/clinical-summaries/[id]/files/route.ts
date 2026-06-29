/**
 * `GET /api/patient/me/clinical-summaries/[id]/files`
 *
 * Lists the files on one of the calling patient's own clinical summaries
 * (newest first). PATIENT-role only, ownership-pinned.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { listSelfClinicalSummaryFiles } from "@/lib/services/patient-self"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = await params
  const files = await listSelfClinicalSummaryFiles({
    patientId,
    actorUserId: userId,
    summaryId: id,
  })
  return ok({ files })
})
