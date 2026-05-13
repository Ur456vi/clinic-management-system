/**
 * `/api/patients` collection routes.
 *
 *   GET  — list patients (paginated, searchable, filterable)
 *   POST — create a new patient
 *
 * Both require an authenticated session. Errors propagate through
 * `defineHandler` -> `errorResponse` so this file stays declarative.
 */

import {
  created,
  defineHandler,
  paginated,
  requireSession,
} from "@/lib/api"
import {
  createPatientSchema,
  listPatientsQuerySchema,
} from "@/lib/validation/patient"
import { createPatient, listPatients } from "@/lib/services/patient"

export const GET = defineHandler(async ({ req }) => {
  await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listPatientsQuerySchema.parse({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    primaryDoctorId: sp.get("primaryDoctorId") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    take: sp.get("take") ?? undefined,
  })

  const { items, nextCursor } = await listPatients(query)
  return paginated(items, { next: nextCursor })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createPatientSchema.parse(await req.json())
  const patient = await createPatient(body, session.userId)
  return created(patient, `/api/patients/${patient.id}`)
})
