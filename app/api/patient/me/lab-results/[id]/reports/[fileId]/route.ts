/**
 * `/api/patient/me/lab-results/[id]/reports/[fileId]`
 *
 *   GET — presigned download URL for one of the patient's own report files.
 *
 * Read-only for the patient; ownership is enforced through the labResult
 * relation. Report files are managed (added/removed) by staff from the admin
 * patient chart, not through the patient portal.
 */

import {
  defineHandler,
  ok,
  requirePatientSession,
  NotFoundError,
} from "@/lib/api"
import { getSelfLabReportFileDownload } from "@/lib/services/patient-self"

type Params = { id: string; fileId: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id, fileId } = await params
  const result = await getSelfLabReportFileDownload({
    patientId,
    actorUserId: userId,
    labResultId: id,
    fileId,
  })
  if (!result) throw new NotFoundError("Report file not found")
  return ok(result)
})
