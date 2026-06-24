/**
 * `GET /api/lab-results/[id]/attachments`
 *
 * Lists every report file on a lab result (newest first). A test can hold
 * multiple files; per-file download + delete live under `[fileId]`. The
 * singular `/attachment` route still serves the latest file + the add (PUT)
 * flow for backward compatibility. READ_ROLES gate (in the service).
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { labResultIdParamSchema } from "@/lib/validation/lab-result"
import { listLabResultAttachments } from "@/lib/services/lab-result"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const files = await listLabResultAttachments(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ files })
})
