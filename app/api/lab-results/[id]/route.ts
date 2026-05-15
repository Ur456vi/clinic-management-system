/**
 * `/api/lab-results/[id]` item routes (BE-16).
 *
 *   GET    — fetch one lab result with the patient summary (READ audit row).
 *   PATCH  — partial update; replaces the analytes array verbatim and
 *            recomputes per-analyte flags server-side.
 *   DELETE — soft-delete (sets `deletedAt`); the row stays in the table
 *            for audit/compliance.
 *
 * All require an authenticated session. Role gates live in the service.
 */

import { defineHandler, noContent, ok, requireSession } from "@/lib/api"
import {
  labResultIdParamSchema,
  updateLabResultSchema,
} from "@/lib/validation/lab-result"
import {
  getLabResult,
  softDeleteLabResult,
  updateLabResult,
} from "@/lib/services/lab-result"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const result = await getLabResult(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(result)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  const body = updateLabResultSchema.parse(await req.json())
  const result = await updateLabResult(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(result)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = labResultIdParamSchema.parse(await params)
  await softDeleteLabResult(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
