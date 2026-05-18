/**
 * `/api/lab-results/[id]/attachment` (BE-20).
 *
 *   PUT    — link an S3 object (already uploaded via BE-19's presigned
 *            PUT flow) to the lab result. WRITE_ROLES gate.
 *   DELETE — clear the attachment fields on the row. Does NOT delete
 *            the underlying S3 object (Sprint-2 cleanup job).
 *            WRITE_ROLES gate.
 *   GET    — mint a short-lived presigned download URL for the current
 *            attachment. READ_ROLES gate; returns 404 when there is no
 *            attachment on the row.
 *
 * Body validation lives in `lib/validation/lab-result.ts`
 * (`attachLabResultBodySchema`); role gates + AuditLog writes live in
 * `lib/services/lab-result.ts`.
 */

import { defineHandler, noContent, ok, requireSession, NotFoundError } from "@/lib/api"
import {
  attachLabResultBodySchema,
  labResultIdParamSchema,
} from "@/lib/validation/lab-result"
import {
  attachToLabResult,
  detachFromLabResult,
  getLabResultAttachmentDownload,
} from "@/lib/services/lab-result"

type Params = { id: string }

export const PUT = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const body = attachLabResultBodySchema.parse(await req.json())
  const labResult = await attachToLabResult(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(labResult)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  await detachFromLabResult(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const result = await getLabResultAttachmentDownload(id, {
    userId: session.userId,
    role: session.role,
  })
  if (!result) throw new NotFoundError("Lab result has no attachment")
  return ok(result)
})
