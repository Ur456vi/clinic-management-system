/**
 * `POST /api/admin/lab/availability`  (staff)
 *
 * Proxies the partner's existing `getAvailableSlots` so reception can pick a
 * slot at prescription time. Body: { pincode, preferredDateTime }.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole, ValidationError } from "@/lib/api"
import { getAvailableSlots, isLabEnabled } from "@/lib/services/lab"
import { availabilitySchema } from "@/lib/validation/lab"

export const POST = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  if (!(await isLabEnabled())) throw new ValidationError("Lab integration is disabled or not configured")
  const body = availabilitySchema.parse(await req.json())
  const result = await getAvailableSlots(body)
  return ok(result)
})
