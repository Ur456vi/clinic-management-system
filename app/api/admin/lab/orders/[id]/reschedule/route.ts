/**
 * `POST /api/admin/lab/orders/:id/reschedule`  (staff)
 *
 * Reschedules a booked order to a new slot via the partner's existing
 * reschedule endpoint (home or centre). Body: { slot }.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { rescheduleOrder, serializeOrder } from "@/lib/services/lab"
import { rescheduleOrderSchema } from "@/lib/validation/lab"

export const POST = defineHandler<{ id: string }>(async ({ req, params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  const { id } = await params
  const { slot } = rescheduleOrderSchema.parse(await req.json())
  const order = await rescheduleOrder(id, slot)
  return ok(serializeOrder(order))
})
