/**
 * `GET /api/patient/me/clinical-summaries/[id]/files/[fileId]`
 *
 * Presigned download URL for one file on one of the calling patient's own
 * clinical summaries. PATIENT-role only; ownership enforced through the
 * summary relation. 404 when the file isn't the patient's.
 */

import {
  defineHandler,
  ok,
  requirePatientSession,
  NotFoundError,
} from "@/lib/api"
import { getSelfClinicalSummaryFileDownload } from "@/lib/services/patient-self"

type Params = { id: string; fileId: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id, fileId } = await params
  const result = await getSelfClinicalSummaryFileDownload({
    patientId,
    actorUserId: userId,
    summaryId: id,
    fileId,
  })
  if (!result) throw new NotFoundError("File not found")
  return ok(result)
})
