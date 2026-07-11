/**
 * `/api/patient/me/lab-results/[id]/report`
 *
 *   GET  — mint a short-lived presigned download URL for the patient's own
 *          report. 404 when there is no attachment on the row.
 *
 * Read-only for the patient: reports are uploaded by staff from the admin
 * patient chart, not through the patient portal.
 *
 * PATIENT-role only (`requirePatientSession`).
 */

import {
  defineHandler,
  ok,
  requirePatientSession,
  NotFoundError,
} from "@/lib/api"
import { getSelfLabReportDownload } from "@/lib/services/patient-self"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = await params

  const result = await getSelfLabReportDownload({
    patientId,
    actorUserId: userId,
    labResultId: id,
  })
  if (!result) throw new NotFoundError("Lab result has no report")
  return ok(result)
})
