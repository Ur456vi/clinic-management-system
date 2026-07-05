/**
 * `GET /api/doctors` — bookable clinicians for the patient self-booking flow.
 *
 * Any authenticated user (patients included) can read this minimal list so
 * the "Book an appointment" page can populate its doctor picker. Returns
 * active DOCTOR / RMO staff only.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireSession } from "@/lib/api"
import { db } from "@/lib/db"

export const GET = defineHandler(async ({ req }) => {
  await requireSession()

  // Optional `?role=RMO` (comma-separated) narrows the list — the patient
  // portal requests RMOs only, since self-bookings are triaged by an RMO
  // first and can't go straight to a doctor.
  const roleParam = req.nextUrl.searchParams.get("role")
  const allowed: Role[] = [Role.DOCTOR, Role.RMO, Role.ADMIN]
  const requested = (roleParam ?? "")
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter((r): r is Role => (allowed as string[]).includes(r))
  const roleFilter = requested.length > 0 ? requested : allowed

  const doctors = await db.staff.findMany({
    where: { isActive: true, user: { role: { in: roleFilter } } },
    select: {
      id: true,
      fullName: true,
      specialization: true,
      department: { select: { id: true, name: true } },
      user: { select: { role: true } },
    },
    orderBy: { fullName: "asc" },
  })

  // Flatten the role off the linked User for a tidy client shape.
  return ok(
    doctors.map((d) => ({
      id: d.id,
      fullName: d.fullName,
      specialization: d.specialization,
      department: d.department,
      role: d.user.role,
    })),
  )
})
