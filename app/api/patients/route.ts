/**
 * `/api/patients` collection routes.
 *
 *   GET  — list patients (paginated, searchable, filterable)
 *   POST — create a new patient
 *
 * Both require an authenticated session. Errors propagate through
 * `defineHandler` -> `errorResponse` so this file stays declarative.
 *
 * BE-12 expanded the GET query surface:
 *   q          - case-insensitive substring match across fullName, email,
 *                phone, patientNumber (alias of legacy `search`).
 *   status     - one or more `PatientStatus` values; comma-separated.
 *   doctorId   - filter on primary doctor (alias of legacy `primaryDoctorId`).
 *   cursor     - keyset cursor (id of last row of the previous page).
 *   limit      - page size, default 20, max 100 (alias of legacy `take`).
 *
 * The response carries both the standard `{ data, pagination: { next } }`
 * envelope (BE-07 convention) AND a top-level `nextCursor` field for the
 * BE-12 contract, so clients written against either spec keep working.
 */

import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

import {
  created,
  defineHandler,
  requireRole,
  requireSession,
} from "@/lib/api"
import {
  createPatientSchema,
  listPatientsQuerySchema,
} from "@/lib/validation/patient"
import { createPatient, listPatients } from "@/lib/services/patient"

/** Front-desk + clinical staff may register a patient (not PATIENT/specialists). */
const PATIENT_WRITE: Role[] = [Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION]

export const GET = defineHandler(async ({ req }) => {
  await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listPatientsQuerySchema.parse({
    // BE-12 canonical names
    q: sp.get("q") ?? undefined,
    doctorId: sp.get("doctorId") ?? undefined,
    limit: sp.get("limit") ?? undefined,
    // legacy aliases (BE-07)
    search: sp.get("search") ?? undefined,
    primaryDoctorId: sp.get("primaryDoctorId") ?? undefined,
    take: sp.get("take") ?? undefined,
    // shared
    status: sp.get("status") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
  })

  const { items, nextCursor } = await listPatients(query)

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireRole(...PATIENT_WRITE)
  const body = createPatientSchema.parse(await req.json())
  const patient = await createPatient(body, session.userId)
  return created(patient, `/api/patients/${patient.id}`)
})
