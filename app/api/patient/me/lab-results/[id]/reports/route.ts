/**
 * `GET /api/patient/me/lab-results/[id]/reports`
 *
 * Lists every report file the patient has uploaded for one of their own lab
 * orders (newest first). A test can hold multiple files; per-file download +
 * delete live under `[fileId]`. PATIENT-role only, ownership-pinned.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { listSelfLabReportFiles } from "@/lib/services/patient-self"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = await params
  const files = await listSelfLabReportFiles({
    patientId,
    actorUserId: userId,
    labResultId: id,
  })
  return ok({ files })
})
