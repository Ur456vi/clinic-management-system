/**
 * `/api/patients/[id]` item routes.
 *
 *   GET    — fetch one patient (writes a READ audit row)
 *   PATCH  — partial update
 *   DELETE — soft-delete (status -> ARCHIVED, deletedAt = now)
 *
 * All routes require an authenticated session.
 */

import { defineHandler, noContent, ok, requireSession } from "@/lib/api"
import { updatePatientSchema } from "@/lib/validation/patient"
import {
  getPatient,
  softDeletePatient,
  updatePatient,
} from "@/lib/services/patient"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = await params
  const patient = await getPatient(id, session.userId)
  return ok(patient)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = await params
  const body = updatePatientSchema.parse(await req.json())
  const patient = await updatePatient(id, body, session.userId)
  return ok(patient)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = await params
  await softDeletePatient(id, session.userId)
  return noContent()
})
