/**
 * `GET /api/appointments/availability` (BE-23).
 *
 * Returns free slot windows for a given staff member between `from`
 * and `to`, at `durationMins` granularity. Used by the patient-portal
 * booking widget (FE-7x) and the reception "find a slot" affordance.
 *
 * Any authenticated user may call this — the heavy enforcement (window
 * cap, working-hours overlay, slot-conflict filtering) lives in the
 * service layer.
 */

import { NextResponse } from "next/server"

import { defineHandler, requireSession } from "@/lib/api"
import { availabilityQuerySchema } from "@/lib/validation/appointment"
import { listAvailability } from "@/lib/services/appointment"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = availabilityQuerySchema.parse({
    staffId: sp.get("staffId") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    durationMins: sp.get("durationMins") ?? undefined,
  })

  const slots = await listAvailability(query, {
    userId: session.userId,
    role: session.role,
  })

  return NextResponse.json({
    data: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  })
})
