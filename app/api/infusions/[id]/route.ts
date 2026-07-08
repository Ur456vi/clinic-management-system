/**
 * `/api/infusions/[id]`
 *
 *   PATCH  — partial update of an infusion session. WRITE_ROLES gate.
 *   DELETE — remove an infusion session. DELETE_ROLES gate (ADMIN only).
 *
 * Role gates + audit writes live in `lib/services/infusion.ts`.
 */

import { defineHandler, noContent, ok, requireSession } from "@/lib/api"
import {
  infusionIdParamSchema,
  updateInfusionSchema,
} from "@/lib/validation/infusion"
import { deleteInfusion, updateInfusion } from "@/lib/services/infusion"

type Params = { id: string }

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = infusionIdParamSchema.parse(await params)
  const body = updateInfusionSchema.parse(await req.json())
  const infusion = await updateInfusion(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(infusion)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = infusionIdParamSchema.parse(await params)
  await deleteInfusion(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
