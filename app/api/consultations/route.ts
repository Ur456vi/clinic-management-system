/**
 * `/api/consultations` collection routes (BE-14).
 *
 *   POST — create a new DRAFT consultation linked to a patient + author.
 *
 * Listing is intentionally not implemented in BE-14 — the patient detail
 * page reads consultations via `/api/patients/:id/consultations` (BE-16).
 */

import { created, defineHandler, requireSession } from "@/lib/api"
import { createConsultationSchema } from "@/lib/validation/consultation"
import { createConsultation } from "@/lib/services/consultation"

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createConsultationSchema.parse(await req.json())
  const consultation = await createConsultation(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(consultation, `/api/consultations/${consultation.id}`)
})
