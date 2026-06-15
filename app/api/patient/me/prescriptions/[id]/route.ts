/**
 * `GET /api/patient/me/prescriptions/[id]`
 *
 * One of the calling patient's prescriptions (a MAIN consultation), returned
 * as raw `sections` + patient header so the portal can render it with the
 * same `PrescriptionSheet` the admin uses. Scoped to the caller's own
 * patientId via `requirePatientSession()`.
 */

import { z } from "zod"

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { getSelfPrescription } from "@/lib/services/patient-self"

const paramSchema = z.object({ id: z.string().uuid({ message: "Must be a valid UUID" }) })

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = paramSchema.parse(await params)

  const data = await getSelfPrescription({
    patientId,
    actorUserId: userId,
    consultationId: id,
  })

  return ok(data)
})
