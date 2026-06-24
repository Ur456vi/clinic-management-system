/**
 * `GET /api/patient/me/invoices/[id]` — one of the calling patient's own
 * invoices (items + payments + department), for the branded portal detail
 * view. PATIENT-role only; ownership is hard-pinned in the service.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { getSelfInvoice } from "@/lib/services/patient-self"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { userId, patientId } = await requirePatientSession()
  const { id } = await params
  const invoice = await getSelfInvoice({
    patientId,
    actorUserId: userId,
    invoiceId: id,
  })
  return ok(invoice)
})
