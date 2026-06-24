/**
 * `/api/patient/me/lab-results/[id]/reports/[fileId]`
 *
 *   GET    — presigned download URL for one of the patient's own report files.
 *   DELETE — remove one report file from the patient's own lab order.
 *
 * PATIENT-role only; ownership is enforced through the labResult relation.
 */

import {
  defineHandler,
  ok,
  noContent,
  requirePatientSession,
  NotFoundError,
} from "@/lib/api"
import {
  deleteSelfLabReportFile,
  getSelfLabReportFileDownload,
} from "@/lib/services/patient-self"

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

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id, fileId } = await params
  await deleteSelfLabReportFile({
    patientId,
    actorUserId: userId,
    labResultId: id,
    fileId,
  })
  return noContent()
})
