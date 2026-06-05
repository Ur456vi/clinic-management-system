/**
 * `GET /api/patient/me/vitals` — the signed-in patient's own vitals.
 *
 * Returns the latest reading plus a short history for the patient
 * dashboard. 404 if the session user isn't linked to a patient record.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { NotFoundError } from "@/lib/errors"
import { getLatestVital, listVitals, patientIdForUser } from "@/lib/services/vitals"

export const GET = defineHandler(async () => {
  const session = await requireSession()
  const patientId = await patientIdForUser(session.userId)
  if (!patientId) throw new NotFoundError("No patient record for this account")

  const [latest, history] = await Promise.all([
    getLatestVital(patientId),
    listVitals(patientId, 10),
  ])

  return ok({ latest, history })
})
