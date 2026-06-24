/**
 * `/api/lab-results/[id]/attachments/[fileId]`
 *
 *   GET    — presigned download URL for one report file. READ_ROLES gate.
 *   DELETE — remove one report file from the lab result. ATTACH_ROLES gate
 *            (whoever can upload can remove a mistaken file). The S3 object is
 *            left for the cleanup job, consistent with detach.
 */

import {
  defineHandler,
  ok,
  noContent,
  requireSession,
  NotFoundError,
} from "@/lib/api"
import { labResultAttachmentParamSchema } from "@/lib/validation/lab-result"
import {
  deleteLabResultAttachment,
  getLabResultAttachmentFileDownload,
} from "@/lib/services/lab-result"

type Params = { id: string; fileId: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id, fileId } = labResultAttachmentParamSchema.parse(await params)
  const result = await getLabResultAttachmentFileDownload(id, fileId, {
    userId: session.userId,
    role: session.role,
  })
  if (!result) throw new NotFoundError("Report file not found")
  return ok(result)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id, fileId } = labResultAttachmentParamSchema.parse(await params)
  await deleteLabResultAttachment(id, fileId, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
