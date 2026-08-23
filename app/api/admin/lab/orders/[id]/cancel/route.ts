/**
 * `POST /api/admin/lab/orders/:id/cancel`  (staff)
 *
 * Cancels a booked order via the partner's existing cancel endpoint (home or
 * centre, chosen by the order's collection mode). Body: { reason }.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { cancelOrder, serializeOrder } from "@/lib/services/lab"
import { cancelOrderSchema } from "@/lib/validation/lab"

export const POST = defineHandler<{ id: string }>(async ({ req, params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  const { id } = await params
  const { reason } = cancelOrderSchema.parse(await req.json())
  const order = await cancelOrder(id, reason)
  return ok(serializeOrder(order))
})
