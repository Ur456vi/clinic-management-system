/**
 * `GET /api/admin/lab/centers`  (staff)
 *
 * The synced partner centre master (from getAllCenters) for the centre picker
 * in the reception booking panel.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"

export const GET = defineHandler(async () => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  const centers = await db.labCenter.findMany({
    orderBy: { name: "asc" },
    select: { centerCode: true, name: true },
  })
  return ok({ centers })
})
