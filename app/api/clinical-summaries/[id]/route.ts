/**
 * `/api/clinical-summaries/[id]`
 *
 *   DELETE — remove a clinical summary and all its files (cascade). The S3
 *            objects are left for the cleanup job, consistent with detach.
 *            WRITE_ROLES gate (in the service).
 */

import { defineHandler, noContent, requireSession } from "@/lib/api"
import { clinicalSummaryIdParamSchema } from "@/lib/validation/clinical-summary"
import { deleteClinicalSummary } from "@/lib/services/clinical-summary"

type Params = { id: string }

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = clinicalSummaryIdParamSchema.parse(await params)
  await deleteClinicalSummary(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
