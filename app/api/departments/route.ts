/**
 * `/api/departments` collection routes (BE-31).
 *
 *   GET  — list departments (paginated, searchable). Auth: any
 *          authenticated clinic user.
 *   POST — create a new department. Auth: ADMIN only.
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
  createDepartmentSchema,
  listDepartmentsQuerySchema,
} from "@/lib/validation/department"
import {
  createDepartment,
  listDepartments,
} from "@/lib/services/department"

export const GET = defineHandler(async ({ req }) => {
  await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listDepartmentsQuerySchema.parse({
    q: sp.get("q") ?? undefined,
    includeInactive: sp.get("includeInactive") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listDepartments(query)

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may create departments")
  }
  const body = createDepartmentSchema.parse(await req.json())
  const department = await createDepartment(body, session.userId)
  return created(department, `/api/departments/${department.id}`)
})
