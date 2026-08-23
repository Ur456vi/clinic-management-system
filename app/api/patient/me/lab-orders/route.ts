/**
 * `GET /api/patient/me/lab-orders`  (patient portal — option 2)
 *
 * The signed-in patient's own lab orders — including PENDING_SCHEDULE ones the
 * patient can book a slot for themselves.
 */

import { defineHandler, ForbiddenError, ok, requirePatientSession } from "@/lib/api"
import { env } from "@/lib/env"
import { listOrdersForPatient } from "@/lib/services/lab"

export const GET = defineHandler(async () => {
  const { patientId } = await requirePatientSession()
  if (!env.FEATURE_LAB_PATIENT_BOOKING) {
    throw new ForbiddenError("Patient self-booking is not enabled")
  }
  const orders = await listOrdersForPatient(patientId)
  return ok({ orders })
})
