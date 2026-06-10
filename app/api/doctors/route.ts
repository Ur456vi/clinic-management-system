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

export const GET = defineHandler(async () => {
  await requireSession()

  const doctors = await db.staff.findMany({
    where: { isActive: true, user: { role: { in: [Role.DOCTOR, Role.RMO] } } },
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
