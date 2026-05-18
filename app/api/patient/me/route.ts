/**
 * `GET /api/patient/me` (BE-50).
 *
 * Returns the calling patient's own profile. Scope is enforced by
 * `requirePatientSession()`: only a signed-in PATIENT-role user with a
 * linked `Patient` row gets through, and the response is always
 * resolved off `session.userId` — never a query parameter.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { getSelfProfile } from "@/lib/services/patient-self"

export const GET = defineHandler(async () => {
  const { userId, patientId } = await requirePatientSession()
  const profile = await getSelfProfile({ patientId, actorUserId: userId })
  return ok(profile)
})
