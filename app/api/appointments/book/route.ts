/**
 * `POST /api/appointments/book` (BE-23).
 *
 * Patient-facing booking endpoint. Two flows:
 *
 *  1. **Patient self-book.** The authenticated user has a `Patient` row
 *     linked via `Patient.userId`. The body must NOT include `patientId`
 *     (or it must match the session-derived patient). The service-layer
 *     derives the patient automatically.
 *  2. **On-behalf booking.** ADMIN or RECEPTION callers pass an explicit
 *     `patientId` in the body to book for a specific patient. Other
 *     staff (DOCTOR / RMO) should use `POST /api/appointments` instead.
 *
 * In both cases the slot is re-checked under `db.$transaction` and a
 * REQUESTED appointment is returned, same wire shape as the staff-side
 * create.
 */

import {
  ForbiddenError,
  created,
  defineHandler,
  requireSession,
} from "@/lib/api"
import { Role } from "@prisma/client"

import { bookAppointmentSchema } from "@/lib/validation/appointment"
import {
  bookAppointmentForPatient,
  bookAppointmentForSelf,
} from "@/lib/services/appointment"

/** Roles allowed to use the on-behalf branch of this endpoint. */
const ON_BEHALF_ROLES: readonly Role[] = [Role.ADMIN, Role.RECEPTION]

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = bookAppointmentSchema.parse(await req.json())

  const isOnBehalfRole = ON_BEHALF_ROLES.includes(session.role)

  // Branch on the presence of `patientId` in the body. If the caller
  // supplied one, they're asking for the on-behalf path — gate it by
  // role here so the 403 carries an obvious message.
  if (body.patientId) {
    if (!isOnBehalfRole) {
      throw new ForbiddenError(
        "Only ADMIN or RECEPTION may book on behalf of another patient",
      )
    }
    const appointment = await bookAppointmentForPatient(
      { ...body, patientId: body.patientId },
      { userId: session.userId, role: session.role },
    )
    return created(appointment, `/api/appointments/${appointment.id}`)
  }

  // No explicit patientId → self-book path. The service resolves the
  // patient via `Patient.userId` and 403s if none is linked.
  const appointment = await bookAppointmentForSelf(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(appointment, `/api/appointments/${appointment.id}`)
})
