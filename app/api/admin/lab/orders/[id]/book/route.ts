/**
 * `POST /api/admin/lab/orders/:id/book`  (staff — option 1, reception books)
 *
 * Books a PENDING_SCHEDULE order against the partner's existing endpoint for
 * the chosen collection mode, using a slot reception selected from
 * getAvailableSlots. Body: bookOrderSchema.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { bookOrder, serializeOrder } from "@/lib/services/lab"
import { bookOrderSchema } from "@/lib/validation/lab"

export const POST = defineHandler<{ id: string }>(async ({ req, params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RECEPTION)
  const { id } = await params
  const body = bookOrderSchema.parse(await req.json())
  const order = await bookOrder(id, { ...body, bookedVia: "RECEPTION" })
  return ok(serializeOrder(order))
})
