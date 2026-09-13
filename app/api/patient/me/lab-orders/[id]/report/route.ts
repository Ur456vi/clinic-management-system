/**
 * `GET /api/patient/me/lab-orders/[id]/report`  (PATIENT)
 *
 * Hands back the partner's report link for one of the patient's own lab orders.
 *
 * Not gated behind the self-booking setting — see ../../reports/route.ts for
 * why. Ownership is re-checked here rather than trusted from the list, so the
 * link is only ever released against a fresh authorisation.
 *
 * NOTE: the partner's report URL is a public link on their host — anyone
 * holding it can open the PDF without authenticating. Releasing it only through
 * this route keeps it out of list payloads and page source, but it does not
 * make the link itself private. Storing a copy in our own object storage, as
 * staff-uploaded reports already are, is the durable fix.
 */

import { defineHandler, ok, requirePatientSession, NotFoundError } from "@/lib/api"
import { db } from "@/lib/db"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const { patientId } = await requirePatientSession()
  const { id } = await params

  const order = await db.labOrder.findUnique({
    where: { id },
    select: { patientId: true, reportUrl: true, reportStatus: true, labNumber: true },
  })

  // Same answer for "not yours" and "does not exist" — an owner check that
  // distinguishes them leaks which order ids are real.
  if (!order || order.patientId !== patientId || !order.reportUrl) {
    throw new NotFoundError("No report available for this order")
  }

  return ok({
    reportUrl: order.reportUrl,
    reportStatus: order.reportStatus,
    labNumber: order.labNumber,
  })
})
