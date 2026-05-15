/**
 * `/api/staff` collection routes (BE-30).
 *
 *   GET  — list staff (paginated, searchable, filterable). Auth: any
 *          authenticated clinic user.
 *   POST — create a new staff member (User + Staff in one transaction).
 *          Auth: ADMIN only.
 */

import { NextResponse } from "next/server"

import {
  created,
  defineHandler,
  ForbiddenError,
  requireSession,
} from "@/lib/api"
import { Role } from "@prisma/client"
import {
  createStaffSchema,
  listStaffQuerySchema,
} from "@/lib/validation/staff"
import { createStaff, listStaff } from "@/lib/services/staff"

export const GET = defineHandler(async ({ req }) => {
  await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listStaffQuerySchema.parse({
    q: sp.get("q") ?? undefined,
    role: sp.get("role") ?? undefined,
    departmentId: sp.get("departmentId") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listStaff(query)

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may create staff")
  }
  const body = createStaffSchema.parse(await req.json())
  const staff = await createStaff(body, session.userId)
  return created(staff, `/api/staff/${staff.id}`)
})
