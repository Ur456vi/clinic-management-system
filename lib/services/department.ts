/**
 * Department service layer (BE-31).
 *
 * Mirrors `lib/services/staff.ts`: routes parse input and delegate here.
 *
 * Default service pricing
 * -----------------------
 * `Department.defaultPricing` is a JSONB column shaped as
 * `{ [serviceCode: string]: number /* paise */ }`. Validation lives in
 * `lib/validation/department.ts`; this layer treats the value as an
 * opaque, already-validated `Record<string, number>` and stores it
 * verbatim. Callers that want to clear the field should send
 * `defaultPricing: null` on PATCH.
 *
 * Soft delete
 * -----------
 * `softDeleteDepartment` flips `isActive` to false; we do NOT cascade to
 * the Staff or Appointment relations because those rows reference the
 * department via `onDelete: SetNull` (Staff) and `Restrict` (Appointment)
 * at the schema level — keeping the row preserves history. The route is
 * additionally idempotent: a second DELETE on an already-archived row
 * returns 204 without re-writing the audit log.
 */

import type { Prisma } from "@prisma/client"
import { Prisma as PrismaNS } from "@prisma/client"

import { db } from "@/lib/db"
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import type {
  CreateDepartmentInput,
  ListDepartmentsQuery,
  UpdateDepartmentInput,
} from "@/lib/validation/department"

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

export type DepartmentPricing = Record<string, number>

/**
 * Public shape of a Department row over the wire. `staffCount` is
 * included as a convenience for admin list views — it counts ALL staff
 * rows (active + soft-deleted) because filtered relation counts are
 * still behind a Prisma preview flag. The FE rarely cares about the
 * distinction at the department-listing level.
 */
export type DepartmentDTO = {
  id: string
  name: string
  slug: string
  description: string | null
  defaultPricing: DepartmentPricing | null
  isActive: boolean
  staffCount: number
  createdAt: Date
  updatedAt: Date
}

const DEPARTMENT_INCLUDE = {
  _count: { select: { staff: true } },
} satisfies Prisma.DepartmentInclude

type DepartmentWithCount = Prisma.DepartmentGetPayload<{
  include: typeof DEPARTMENT_INCLUDE
}>

function toPricing(value: Prisma.JsonValue | null): DepartmentPricing | null {
  if (value === null || value === undefined) return null
  if (typeof value !== "object" || Array.isArray(value)) return null
  const out: DepartmentPricing = {}
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "number") out[k] = v
  }
  return out
}

function toDTO(row: DepartmentWithCount): DepartmentDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    defaultPricing: toPricing(row.defaultPricing as Prisma.JsonValue | null),
    isActive: row.isActive,
    staffCount: row._count.staff,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListDepartmentsResult = {
  items: DepartmentDTO[]
  nextCursor: string | null
}

/**
 * Paginated department list.
 *
 * Ordering is `name asc, id asc` — departments are a small enum-shaped
 * set (≤a few dozen rows) so an alphabetical view is almost always what
 * the FE wants. Cursor is the `id` of the last row of the previous page;
 * we over-fetch by one to detect a next page.
 *
 * `includeInactive` is a tri-state — see the validator for semantics.
 */
export async function listDepartments(
  input: ListDepartmentsQuery,
): Promise<ListDepartmentsResult> {
  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.DepartmentWhereInput = {}
  if (input.includeInactive === "false") {
    where.isActive = true
  } else if (input.includeInactive === "only") {
    where.isActive = false
  }
  // "true" → no filter on isActive.

  if (input.q && input.q.length > 0) {
    const q = input.q
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }

  const rows = await db.department.findMany({
    where,
    include: DEPARTMENT_INCLUDE,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ name: "asc" }, { id: "asc" }],
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  return { items: rows.map(toDTO), nextCursor }
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

export async function getDepartment(
  id: string,
  actorUserId: string,
): Promise<DepartmentDTO> {
  const row = await db.department.findUnique({
    where: { id },
    include: DEPARTMENT_INCLUDE,
  })
  if (!row) throw new NotFoundError("Department not found")

  try {
    await db.auditLog.create({
      data: {
        actorUserId,
        action: "READ",
        entityType: "Department",
        entityId: row.id,
      },
    })
  } catch (err) {
    // Audit failure must not break the read. Departments aren't PHI but
    // we keep the trail for parity with other resources.
    // eslint-disable-next-line no-console
    console.error("[department.getDepartment] audit write failed", err)
  }

  return toDTO(row)
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a department.
 *
 * `name` and `slug` are both unique columns. We let Prisma raise P2002 on
 * the race and rewrite it into a `ConflictError` with a usable `target`.
 * The up-front check shaves a round trip in the happy path and produces
 * a clearer error message than the raw P2002 text.
 */
export async function createDepartment(
  input: CreateDepartmentInput,
  actorUserId: string,
): Promise<DepartmentDTO> {
  const existing = await db.department.findFirst({
    where: { OR: [{ name: input.name }, { slug: input.slug }] },
    select: { name: true, slug: true },
  })
  if (existing) {
    const target =
      existing.name === input.name ? "name" : "slug"
    throw new ConflictError(
      `A department with this ${target} already exists`,
      { target: [target] },
    )
  }

  try {
    return await db.$transaction(async (tx) => {
      const row = await tx.department.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          defaultPricing:
            input.defaultPricing === undefined
              ? PrismaNS.DbNull
              : (input.defaultPricing as Prisma.InputJsonValue),
        },
        include: DEPARTMENT_INCLUDE,
      })

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "Department",
          entityId: row.id,
          detail: {
            after: {
              id: row.id,
              name: row.name,
              slug: row.slug,
              hasPricing: row.defaultPricing !== null,
            },
          },
        },
      })

      return toDTO(row)
    })
  } catch (err) {
    if (
      err instanceof PrismaNS.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = (err.meta?.target as string[] | undefined) ?? ["name"]
      throw new ConflictError(
        `A department with this ${target.join(", ")} already exists`,
        { target },
      )
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Partial update. Auth (ADMIN-only) is enforced by the route.
 *
 * Special handling:
 *   - `defaultPricing: null` clears the column (Prisma needs DbNull, not
 *     `null`, to write a SQL NULL into a Json column);
 *   - re-activating a soft-deleted row is allowed via `isActive: true`;
 *   - name/slug conflicts surface as `CONFLICT` with `details.target`.
 */
export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
  actorUserId: string,
): Promise<DepartmentDTO> {
  return db.$transaction(async (tx) => {
    const before = await tx.department.findUnique({
      where: { id },
      include: DEPARTMENT_INCLUDE,
    })
    if (!before) throw new NotFoundError("Department not found")

    const data: Prisma.DepartmentUpdateInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.slug !== undefined) data.slug = input.slug
    if (input.description !== undefined) {
      data.description = input.description
    }
    if (input.defaultPricing !== undefined) {
      data.defaultPricing =
        input.defaultPricing === null
          ? PrismaNS.DbNull
          : (input.defaultPricing as Prisma.InputJsonValue)
    }
    if (input.isActive !== undefined) data.isActive = input.isActive

    let after: DepartmentWithCount
    try {
      after = await tx.department.update({
        where: { id },
        data,
        include: DEPARTMENT_INCLUDE,
      })
    } catch (err) {
      if (
        err instanceof PrismaNS.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const target = (err.meta?.target as string[] | undefined) ?? ["name"]
        throw new ConflictError(
          `A department with this ${target.join(", ")} already exists`,
          { target },
        )
      }
      throw err
    }

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Department",
        entityId: after.id,
        detail: {
          before: {
            name: before.name,
            slug: before.slug,
            isActive: before.isActive,
            hasPricing: before.defaultPricing !== null,
          },
          after: {
            name: after.name,
            slug: after.slug,
            isActive: after.isActive,
            hasPricing: after.defaultPricing !== null,
          },
        },
      },
    })

    return toDTO(after)
  })
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

/**
 * Soft-delete a department (`isActive = false`).
 *
 * Refuses to archive a department that still has active staff assigned —
 * the FE flow is "reassign the staff first" rather than silently
 * detaching them. Surfaces as 400 VALIDATION_ERROR with
 * `details.code = DEPARTMENT_HAS_ACTIVE_STAFF`.
 *
 * Idempotent: archiving an already-archived row is a no-op and does not
 * write an audit row.
 */
export async function softDeleteDepartment(
  id: string,
  actorUserId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const before = await tx.department.findUnique({
      where: { id },
      include: DEPARTMENT_INCLUDE,
    })
    if (!before) throw new NotFoundError("Department not found")
    if (!before.isActive) return // idempotent

    const activeStaffCount = await tx.staff.count({
      where: { departmentId: id, isActive: true },
    })
    if (activeStaffCount > 0) {
      throw new ValidationError(
        "Department still has active staff; reassign them first",
        {
          code: "DEPARTMENT_HAS_ACTIVE_STAFF",
          activeStaffCount,
        },
      )
    }

    const after = await tx.department.update({
      where: { id },
      data: { isActive: false },
      include: DEPARTMENT_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "DELETE",
        entityType: "Department",
        entityId: after.id,
        detail: {
          before: { isActive: before.isActive },
          after: { isActive: after.isActive },
          method: "soft-delete (isActive=false)",
        },
      },
    })
  })
}
