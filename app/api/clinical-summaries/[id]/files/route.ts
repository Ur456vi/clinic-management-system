/**
 * `/api/clinical-summaries/[id]/files`
 *
 *   GET  — list every file on a summary (newest first). READ_ROLES gate.
 *   POST — attach an already-uploaded S3 object as a new file. The client went
 *          through `POST /api/files/upload-url` → `PUT <s3>` first; this body
 *          just links the resulting key. WRITE_ROLES gate.
 */

import { created, defineHandler, ok, requireSession } from "@/lib/api"
import {
  attachClinicalSummaryFileSchema,
  clinicalSummaryIdParamSchema,
} from "@/lib/validation/clinical-summary"
import {
  attachClinicalSummaryFile,
  listClinicalSummaryFiles,
} from "@/lib/services/clinical-summary"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = clinicalSummaryIdParamSchema.parse(await params)
  const files = await listClinicalSummaryFiles(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ files })
})

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = clinicalSummaryIdParamSchema.parse(await params)
  const body = attachClinicalSummaryFileSchema.parse(await req.json())
  const file = await attachClinicalSummaryFile(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return created(file)
})
