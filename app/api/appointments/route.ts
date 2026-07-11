/**
 * `/api/appointments` collection routes (BE-27).
 *
 *   GET  — list appointments (cursor-paginated, filterable).
 *   POST — create a new REQUESTED appointment.
 *
 * Both require an authenticated session. The service layer enforces the
 * role gates (WRITE_ROLES for POST, VIEW_ROLES for GET), the slot-conflict
 * check (POST), and the audit-log writes.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from "@/lib/validation/appointment"
import {
  createAppointment,
  listAppointments,
} from "@/lib/services/appointment"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listAppointmentsQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    staffId: sp.get("staffId") ?? undefined,
    departmentId: sp.get("departmentId") ?? undefined,
    status: sp.get("status") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
    excludePrimaryDoctor: sp.get("excludePrimary") ?? undefined,
  })

  const { items, nextCursor } = await listAppointments(query, 
    {
      userId: session.userId,
      role: session.role,
    }
)

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createAppointmentSchema.parse(await req.json())
  const appointment = await createAppointment(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(appointment, `/api/appointments/${appointment.id}`)
})
