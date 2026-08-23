/**
 * `POST /api/patient/me/lab-orders/:id/book`  (patient portal — option 2)
 *
 * The patient books their own PENDING_SCHEDULE order — choosing home/centre and
 * a slot from getAvailableSlots. Ownership is enforced: a patient can only book
 * an order that belongs to them. Body: bookOrderSchema.
 */

import { defineHandler, ok, requirePatientSession, ForbiddenError } from "@/lib/api"
import { env } from "@/lib/env"
import { assertOrderOwnedByPatient, bookOrder, serializeOrder } from "@/lib/services/lab"
import { bookOrderSchema } from "@/lib/validation/lab"

export const POST = defineHandler<{ id: string }>(async ({ req, params }) => {
  const { patientId } = await requirePatientSession()
  if (!env.FEATURE_LAB_PATIENT_BOOKING) throw new ForbiddenError("Patient self-booking is not enabled")
  const { id } = await params
  try {
    await assertOrderOwnedByPatient(id, patientId)
  } catch {
    throw new ForbiddenError("This lab order does not belong to you")
  }
  const body = bookOrderSchema.parse(await req.json())
  const order = await bookOrder(id, { ...body, bookedVia: "PATIENT" })
  return ok(serializeOrder(order))
})
