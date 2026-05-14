/**
 * `/api/consultations/[id]` item routes (BE-14).
 *
 *   GET   — fetch one consultation with author + patient summary (READ audit row).
 *   PATCH — partial save / autosave. Shallow-merges `sections` at the top
 *           level; supports status transitions per ALLOWED_STATUS_TRANSITIONS.
 *
 * Both require an authenticated session. Role gates and the immutable
 * SIGNED check live in `lib/services/consultation.ts`.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  consultationIdParamSchema,
  updateConsultationSchema,
} from "@/lib/validation/consultation"
import {
  getConsultation,
  updateConsultation,
} from "@/lib/services/consultation"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = consultationIdParamSchema.parse(await params)
  const consultation = await getConsultation(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(consultation)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = consultationIdParamSchema.parse(await params)
  const body = updateConsultationSchema.parse(await req.json())
  const consultation = await updateConsultation(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(consultation)
})
