/**
 * `/api/clinical-summaries/[id]/files/[fileId]`
 *
 *   GET    — presigned download URL for one summary file. READ_ROLES gate.
 *   DELETE — remove one file from the summary. WRITE_ROLES gate. The S3 object
 *            is left for the cleanup job, consistent with detach.
 */

import {
  defineHandler,
  ok,
  noContent,
  requireSession,
  NotFoundError,
} from "@/lib/api"
import { clinicalSummaryFileParamSchema } from "@/lib/validation/clinical-summary"
import {
  deleteClinicalSummaryFile,
  getClinicalSummaryFileDownload,
} from "@/lib/services/clinical-summary"

type Params = { id: string; fileId: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id, fileId } = clinicalSummaryFileParamSchema.parse(await params)
  const result = await getClinicalSummaryFileDownload(id, fileId, {
    userId: session.userId,
    role: session.role,
  })
  if (!result) throw new NotFoundError("File not found")
  return ok(result)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id, fileId } = clinicalSummaryFileParamSchema.parse(await params)
  await deleteClinicalSummaryFile(id, fileId, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
