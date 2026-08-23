/**
 * `GET /api/admin/lab/orders`  (staff)
 *
 * Lists lab orders for the reception scheduling queue. Filter with
 * `?status=PENDING_SCHEDULE` (default shows all) and `?patientId=`.
 */

import { LabOrderStatus, Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { listOrdersForStaff } from "@/lib/services/lab"

const STATUSES = new Set(Object.values(LabOrderStatus))

export const GET = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  const sp = req.nextUrl.searchParams
  const statusRaw = sp.get("status")
  const status = statusRaw && STATUSES.has(statusRaw as LabOrderStatus) ? (statusRaw as LabOrderStatus) : undefined
  const patientId = sp.get("patientId") ?? undefined
  const orders = await listOrdersForStaff({ status, patientId })
  return ok({ orders })
})
