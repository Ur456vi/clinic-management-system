/**
 * `/api/staff/[id]` item routes (BE-30).
 *
 *   GET    — fetch one staff member (writes a READ audit row).
 *            Auth: any authenticated clinic user.
 *   PATCH  — partial update. Auth: ADMIN, or self for
 *            `firstName` / `lastName` / `phone` only.
 *   DELETE — soft-delete (Staff.isActive=false + User.isActive=false).
 *            Auth: ADMIN only. Cannot archive yourself.
 */

import {
  defineHandler,
  ForbiddenError,
  noContent,
  ok,
  requireSession,
  ValidationError,
} from "@/lib/api"
import { Role } from "@prisma/client"
import { updateStaffSchema } from "@/lib/validation/staff"
import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/api"
import {
  getStaff,
  softDeleteStaff,
  updateStaff,
} from "@/lib/services/staff"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = await params
  const staff = await getStaff(id, session.userId)
  return ok(staff)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = await params

  // Parse first so a malformed body returns 400 regardless of role.
  const raw = (await req.json()) as Record<string, unknown>

  // Email is immutable at this endpoint — surface a stable error code
  // the FE can pin against.
  if (Object.prototype.hasOwnProperty.call(raw, "email")) {
    throw new ValidationError("Email cannot be changed via PATCH", {
      code: "EMAIL_IMMUTABLE",
    })
  }

  const body = updateStaffSchema.parse(raw)

  // Authorise: ADMIN, or the staff member's own user.
  if (session.role !== Role.ADMIN) {
    const target = await db.staff.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!target) throw new NotFoundError("Staff not found")
    if (target.userId !== session.userId) {
      throw new ForbiddenError("Only ADMIN may edit other staff members")
    }
  }

  const staff = await updateStaff(body, {
    staffId: id,
    actorUserId: session.userId,
    actorRole: session.role,
  })
  return ok(staff)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may archive staff")
  }
  const { id } = await params
  await softDeleteStaff(id, session.userId)
  return noContent()
})
