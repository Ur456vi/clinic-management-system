/**
 * `POST /api/patient/me/lab-orders/availability`  (patient portal — option 2)
 *
 * The patient fetches bookable slots (partner's existing getAvailableSlots)
 * before self-booking. Body: { pincode, preferredDateTime }.
 */

import { defineHandler, ForbiddenError, ok, requirePatientSession, ValidationError } from "@/lib/api"
import { env } from "@/lib/env"
import { getAvailableSlots, isLabEnabled } from "@/lib/services/lab"
import { availabilitySchema } from "@/lib/validation/lab"

export const POST = defineHandler(async ({ req }) => {
  await requirePatientSession()
  if (!env.FEATURE_LAB_PATIENT_BOOKING) throw new ForbiddenError("Patient self-booking is not enabled")
  if (!isLabEnabled()) throw new ValidationError("Lab booking is currently unavailable")
  const body = availabilitySchema.parse(await req.json())
  const result = await getAvailableSlots(body)
  return ok(result)
})
