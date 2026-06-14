/**
 * `/api/departments/[id]` item routes (BE-31).
 *
 *   GET    — fetch one department (writes a READ audit row).
 *            Auth: any authenticated clinic user.
 *   PATCH  — partial update. Auth: ADMIN only.
 *   DELETE — permanently delete the department. Auth: ADMIN only.
 *            Linked staff/appointments/invoices are detached (SetNull).
 */

import {
  defineHandler,
  ForbiddenError,
  noContent,
  ok,
  requireSession,
} from "@/lib/api"
import { Role } from "@prisma/client"
import { updateDepartmentSchema } from "@/lib/validation/department"
import {
  getDepartment,
  hardDeleteDepartment,
  updateDepartment,
} from "@/lib/services/department"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = await params
  const department = await getDepartment(id, session.userId)
  return ok(department)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may edit departments")
  }
  const { id } = await params
  const body = updateDepartmentSchema.parse(await req.json())
  const department = await updateDepartment(id, body, session.userId)
  return ok(department)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may delete departments")
  }
  const { id } = await params
  await hardDeleteDepartment(id, session.userId)
  return noContent()
})
