/**
 * `/api/infusion-logs/[id]` item routes (BE-26).
 *
 *   GET    — fetch one infusion log with patient + staff + consultation
 *            summary (writes a READ audit row).
 *   PATCH  — partial update of content fields (protocol, agents,
 *            startedAt, completedAt, reaction, notes, consultationId).
 *            Status changes go through
 *            `/api/infusion-logs/[id]/transition`.
 *   DELETE — hard-delete (ADMIN only). The expected soft-delete path is
 *            to transition the row to `ABORTED`.
 *
 * All three require an authenticated session; role gates and audit
 * writes live in `lib/services/infusion-log.ts`.
 */

import { defineHandler, noContent, ok, requireSession } from "@/lib/api"
import {
  infusionLogIdParamSchema,
  updateInfusionLogSchema,
} from "@/lib/validation/infusion-log"
import {
  deleteInfusionLog,
  getInfusionLog,
  updateInfusionLog,
} from "@/lib/services/infusion-log"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = infusionLogIdParamSchema.parse(await params)
  const log = await getInfusionLog(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(log)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = infusionLogIdParamSchema.parse(await params)
  const body = updateInfusionLogSchema.parse(await req.json())
  const log = await updateInfusionLog(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(log)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = infusionLogIdParamSchema.parse(await params)
  await deleteInfusionLog(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
