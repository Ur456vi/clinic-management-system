/**
 * `GET /api/patient/me/lab-orders/summary`  (PATIENT)
 *
 * Every partner-lab order belonging to the patient — pending ones included, not
 * just those with a report.
 *
 * Pending matters: a test the partner fulfils no longer gets a LabResult row
 * (see materializeLabOrdersFromConsultation), so this is the ONLY record of it
 * until the report arrives. Filtering to reported orders would make a
 * prescribed test disappear from the patient's view for the whole time it is
 * actually being done.
 *
 * Deliberately SEPARATE from `GET /api/patient/me/lab-orders`, which is gated
 * behind the patient self-booking setting. Viewing a report you already have is
 * not self-booking — gating it behind that flag would hide finished results from
 * patients whenever reception-only booking is in force, which is the default.
 *
 * Returns the report pointer, never the URL itself. The URL is a public link on
 * the partner's host, so it is handed out only through
 * `/api/patient/me/lab-orders/[id]/report`, which re-checks ownership at the
 * moment of access rather than embedding the link in a list response.
 */

import { defineHandler, ok, requirePatientSession } from "@/lib/api"
import { db } from "@/lib/db"

export const GET = defineHandler(async () => {
  const { patientId } = await requirePatientSession()

  const orders = await db.labOrder.findMany({
    where: { patientId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      reportStatus: true,
      labNumber: true,
      collectionMode: true,
      appointmentStart: true,
      updatedAt: true,
      createdAt: true,
      reportUrl: true,
      items: true,
    },
  })

  return ok({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      reportStatus: o.reportStatus,
      labNumber: o.labNumber,
      collectionMode: o.collectionMode,
      appointmentStart: o.appointmentStart?.toISOString() ?? null,
      updatedAt: o.updatedAt.toISOString(),
      createdAt: o.createdAt.toISOString(),
      // The URL itself is never sent here — only whether one exists. It is
      // released by ../[id]/report, which re-checks ownership at access time.
      hasReport: o.reportUrl !== null,
      testNames: ((o.items as unknown as { testName?: string }[]) ?? [])
        .map((i) => i.testName)
        .filter((n): n is string => Boolean(n)),
    })),
  })
})
