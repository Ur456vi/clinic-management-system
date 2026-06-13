/**
 * `/api/patients/[id]` item routes.
 *
 *   GET    — fetch one patient (writes a READ audit row)  [staff only]
 *   PATCH  — partial update                               [ADMIN/DOCTOR/RMO/RECEPTION]
 *   DELETE — soft-delete (status -> ARCHIVED)             [ADMIN only]
 *
 * Admin endpoint — gated to staff. Patients use /api/patient/me/* for
 * self-service; they must not be able to read or mutate other patients.
 */

import { Role } from "@prisma/client"

import { defineHandler, noContent, ok, requireRole } from "@/lib/api"
import { updatePatientSchema } from "@/lib/validation/patient"
import {
  getPatient,
  softDeletePatient,
  updatePatient,
} from "@/lib/services/patient"

type Params = { id: string }

/** Any staff member may view a chart; only clinical/front-desk staff may
 *  edit; archiving is ADMIN-only. */
const STAFF_VIEW: Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
  Role.INFUSION_SPECIALIST,
  Role.REHAB_SPECIALIST,
  Role.AESTHETICS_SPECIALIST,
]
const PATIENT_WRITE: Role[] = [Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION]

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireRole(...STAFF_VIEW)
  const { id } = await params
  const patient = await getPatient(id, session.userId)
  return ok(patient)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireRole(...PATIENT_WRITE)
  const { id } = await params
  const body = updatePatientSchema.parse(await req.json())
  const patient = await updatePatient(id, body, session.userId)
  return ok(patient)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireRole(Role.ADMIN)
  const { id } = await params
  await softDeletePatient(id, session.userId)
  return noContent()
})
