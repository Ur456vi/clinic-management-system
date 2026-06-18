/**
 * `/api/patient/me/lab-results/[id]/report`
 *
 *   POST — patient uploads the report PDF for one of their own lab orders
 *          (multipart, form field `file`). Server-side upload (like the
 *          avatar flow) so the patient never handles a raw presigned S3
 *          URL. Ownership is hard-pinned to the calling patient in the
 *          service layer; PDFs only, 25 MB cap. Stamps reportedAt so the
 *          order flips from active → completed.
 *
 *   GET  — mint a short-lived presigned download URL for the patient's own
 *          report. 404 when there is no attachment on the row.
 *
 * PATIENT-role only (`requirePatientSession`).
 */

import {
  defineHandler,
  ok,
  requirePatientSession,
  NotFoundError,
  ValidationError,
} from "@/lib/api"
import {
  getSelfLabReportDownload,
  uploadSelfLabReport,
} from "@/lib/services/patient-self"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = await params

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    throw new ValidationError("Expected multipart/form-data with a `file` field")
  }

  const file = form.get("file")
  if (!file || typeof file === "string") {
    throw new ValidationError("Missing `file` upload")
  }
  const upload = file as File
  const buffer = Buffer.from(await upload.arrayBuffer())

  const result = await uploadSelfLabReport({
    patientId,
    actorUserId: userId,
    labResultId: id,
    buffer,
    contentType: upload.type,
    filename: upload.name,
  })

  return ok(result)
})

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
