/**
 * Staff service layer (BE-30).
 *
 * Mirrors `lib/services/patient.ts`: routes parse input and delegate here.
 *
 * Schema reality check
 * --------------------
 * The BE-03 `Staff` model stores a single `fullName` column (no firstName /
 * lastName split) and uses `isActive` flags instead of `archivedAt` /
 * `disabledAt` columns. To honour the BE-30 spec without editing the
 * schema (BE-27's turf this shift) we:
 *
 *   - accept `firstName` + `lastName` at the API boundary and join them
 *     with a single space before writing to `fullName`;
 *   - on read, split `fullName` on the LAST whitespace so the response
 *     carries both pieces deterministically (`firstName` is everything
 *     before the last space; `lastName` is everything after; if there is
 *     no space, `lastName` is empty);
 *   - soft-delete by flipping `Staff.isActive` and `User.isActive` to
 *     false. Both flags are checked by the credentials provider, so a
 *     "deleted" staff member can no longer sign in.
 *
 * The follow-up note BE-30b will (a) add a true `archivedAt` to Staff +
 * `disabledAt` to User and (b) split `fullName` into proper columns.
 */

import type { Prisma } from "@prisma/client"
import { Role } from "@prisma/client"

import { db } from "@/lib/db"
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors"
import { hashPassword } from "@/lib/passwords"
import { recordAudit } from "@/lib/services/audit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { effectiveAreasFor, sanitizeAreaKeys } from "@/lib/rbac"
import type {
  CreateStaffInput,
  ListStaffQuery,
  UpdateStaffInput,
} from "@/lib/validation/staff"

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

/**
 * Public shape of a Staff row over the wire. We project a synthetic
 * `firstName`/`lastName` pair out of `fullName` and inline the related
 * `user.email` + a thin department summary so single-fetch FE views
 * don't need a follow-up call.
 */
export type StaffDTO = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: Role
  phone: string | null
  departmentId: string | null
  department: { id: string; name: string; slug: string } | null
  isActive: boolean
  /** Raw per-staff area override (empty = using role defaults). */
  allowedAreas: string[]
  /** Resolved areas this staff member can open (override or role default). */
  effectiveAreas: string[]
  createdAt: Date
  updatedAt: Date
}

const STAFF_INCLUDE = {
  user: { select: { email: true, role: true, isActive: true } },
  department: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.StaffInclude

type StaffWithRels = Prisma.StaffGetPayload<{ include: typeof STAFF_INCLUDE }>

/** Split `fullName` into `firstName` / `lastName` on the LAST whitespace. */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const i = trimmed.lastIndexOf(" ")
  if (i < 0) return { firstName: trimmed, lastName: "" }
  return {
    firstName: trimmed.slice(0, i).trim(),
    lastName: trimmed.slice(i + 1).trim(),
  }
}

function toDTO(row: StaffWithRels): StaffDTO {
  const { firstName, lastName } = splitName(row.fullName)
  return {
    id: row.id,
    userId: row.userId,
    email: row.user.email,
    firstName,
    lastName,
    fullName: row.fullName,
    role: row.user.role,
    phone: row.phone,
    departmentId: row.departmentId,
    department: row.department
      ? {
          id: row.department.id,
          name: row.department.name,
          slug: row.department.slug,
        }
      : null,
    // Treat the staff member as active only when BOTH flags are set —
    // see the soft-delete note in the file header.
    isActive: row.isActive && row.user.isActive,
    allowedAreas: row.allowedAreas,
    effectiveAreas: effectiveAreasFor(row.user.role, row.allowedAreas),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListStaffResult = {
  items: StaffDTO[]
  nextCursor: string | null
}

/**
 * Search / filter / paginate staff.
 *
 * Cursor is the `Staff.id` of the last row of the previous page. We
 * over-fetch by one row to know whether a next page exists. Ordering is
 * `fullName asc, id asc` — the spec asked for "lastName asc, id asc" but
 * the DB column is `fullName`; FE callers should treat the ordering as a
 * stable alphabetical sort and revisit once BE-30b splits the columns.
 *
 * By default soft-deleted (`isActive=false`) rows are hidden. There is no
 * filter to surface them yet — that will land with BE-30b when the
 * `archivedAt` column exists.
 */
export async function listStaff(
  input: ListStaffQuery,
): Promise<ListStaffResult> {
  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const userFilter: Prisma.UserWhereInput = { isActive: true }
  if (input.role && input.role.length > 0) {
    userFilter.role = { in: input.role }
  }

  const where: Prisma.StaffWhereInput = {
    isActive: true,
    user: userFilter,
  }

  if (input.departmentId) {
    where.departmentId = input.departmentId
  }

  if (input.q && input.q.length > 0) {
    const q = input.q
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ]
  }

  const rows = await db.staff.findMany({
    where,
    include: STAFF_INCLUDE,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
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

export async function getStaff(
  id: string,
  actorUserId: string,
): Promise<StaffDTO> {
  const row = await db.staff.findUnique({
    where: { id },
    include: STAFF_INCLUDE,
  })
  if (!row) throw new NotFoundError("Staff not found")

  await recordAudit({
    actorUserId,
    action: "READ",
    entityType: "Staff",
    entityId: row.id,
  })

  return toDTO(row)
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create the User + Staff rows atomically and write a CREATE audit row.
 *
 * Email uniqueness is checked up-front so the error envelope reads
 * `CONFLICT` with a useful message rather than a generic P2002. The
 * transaction guards against the inevitable race.
 *
 * Password handling:
 *   - if `password` is provided, we bcrypt-hash it (cost 12) via
 *     `hashPassword`;
 *   - if omitted, the User row gets an empty-string `passwordHash`.
 *     The credentials provider's `verifyPassword` returns `false` on an
 *     empty hash, so the account is effectively locked until the admin
 *     triggers the password-reset OTP flow (BE-05) for it.
 *
 * The User row's `role` is mirrored from the input — clinic-side role
 * lives on User today, not on Staff.
 */
export async function createStaff(
  input: CreateStaffInput,
  actorUserId: string,
): Promise<StaffDTO> {
  const existing = await db.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new ConflictError("A user with this email already exists", {
      target: ["email"],
    })
  }

  const passwordHash = input.password ? await hashPassword(input.password) : ""
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim()

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
      },
    })

    const staff = await tx.staff.create({
      data: {
        userId: user.id,
        fullName,
        phone: input.phone ?? null,
        departmentId: input.departmentId ?? null,
        allowedAreas: sanitizeAreaKeys(input.allowedAreas),
      },
      include: STAFF_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId,
        action: "CREATE",
        entityType: "Staff",
        entityId: staff.id,
        detail: {
          after: {
            id: staff.id,
            userId: staff.userId,
            email: staff.user.email,
            role: staff.user.role,
            fullName: staff.fullName,
            departmentId: staff.departmentId,
          },
          passwordSet: Boolean(input.password),
        },
      },
      { tx },
    )

    return toDTO(staff)
  })
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export type UpdateStaffPolicy = {
  /** UUID of the staff row being patched. */
  staffId: string
  /** UUID of the User performing the patch. */
  actorUserId: string
  /** Role of the actor — `requireSession()` returns this. */
  actorRole: Role
}

/**
 * Apply a partial update.
 *
 * Authorisation rules (the spec's "role-gate matrix"):
 *   - ADMIN              → may patch ANY field on ANY staff row.
 *   - self (same User)   → may patch `firstName`, `lastName`, `phone` on
 *                          their own staff row. Self-patching `role` or
 *                          `departmentId` is a 400 (VALIDATION_ERROR with
 *                          details.code = SELF_ROLE_CHANGE).
 *   - any other actor    → FORBIDDEN (the route enforces this).
 *
 * Email mutation is rejected by the ROUTE before we get here (returns
 * 400 with details.code = EMAIL_IMMUTABLE), so this layer never sees it.
 */
export async function updateStaff(
  input: UpdateStaffInput,
  policy: UpdateStaffPolicy,
): Promise<StaffDTO> {
  return db.$transaction(async (tx) => {
    const before = await tx.staff.findUnique({
      where: { id: policy.staffId },
      include: STAFF_INCLUDE,
    })
    if (!before) throw new NotFoundError("Staff not found")

    const isAdmin = policy.actorRole === Role.ADMIN
    const isSelf = before.userId === policy.actorUserId

    if (!isAdmin && !isSelf) {
      // Route already guards this but defence in depth never hurts.
      throw new NotFoundError("Staff not found")
    }
    if (!isAdmin && isSelf) {
      // Self-edit: forbid role / department / access changes.
      if (
        input.role !== undefined ||
        input.departmentId !== undefined ||
        input.allowedAreas !== undefined
      ) {
        throw new ValidationError(
          "You may not change your own role, department, or access",
          { code: "SELF_ROLE_CHANGE" },
        )
      }
    }

    // Compose the new fullName if either part changed.
    let newFullName: string | undefined
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const split = splitName(before.fullName)
      const firstName = (input.firstName ?? split.firstName).trim()
      const lastName = (input.lastName ?? split.lastName).trim()
      newFullName = `${firstName} ${lastName}`.trim()
    }

    const staffData: Prisma.StaffUpdateInput = {}
    if (newFullName !== undefined) staffData.fullName = newFullName
    if (input.phone !== undefined) staffData.phone = input.phone ?? null
    if (input.allowedAreas !== undefined) {
      staffData.allowedAreas = sanitizeAreaKeys(input.allowedAreas)
    }
    if (input.departmentId !== undefined) {
      staffData.department =
        input.departmentId === null
          ? { disconnect: true }
          : { connect: { id: input.departmentId } }
    }

    const userData: Prisma.UserUpdateInput = {}
    if (input.role !== undefined) userData.role = input.role

    const after = await tx.staff.update({
      where: { id: policy.staffId },
      data: {
        ...staffData,
        ...(Object.keys(userData).length > 0
          ? { user: { update: userData } }
          : {}),
      },
      include: STAFF_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId: policy.actorUserId,
        action: "UPDATE",
        entityType: "Staff",
        entityId: after.id,
        detail: {
          before: {
            fullName: before.fullName,
            phone: before.phone,
            role: before.user.role,
            departmentId: before.departmentId,
          },
          after: {
            fullName: after.fullName,
            phone: after.phone,
            role: after.user.role,
            departmentId: after.departmentId,
          },
        },
      },
      { tx },
    )

    return toDTO(after)
  })
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

/**
 * Soft-delete a staff member.
 *
 * Flips `Staff.isActive` AND `User.isActive` to false so the next sign-in
 * attempt fails. The rows stay in the DB to preserve audit trail and any
 * FK references (Patient.primaryDoctorId, Consultation creators, etc.).
 *
 * Authorisation: ADMIN only — enforced by the route. Additionally, an
 * actor may not archive themselves; we throw a 400 ValidationError with
 * `details.code = CANNOT_ARCHIVE_SELF` so a careless click cannot lock
 * the last admin out.
 */
export async function softDeleteStaff(
  staffId: string,
  actorUserId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const before = await tx.staff.findUnique({
      where: { id: staffId },
      include: STAFF_INCLUDE,
    })
    if (!before) throw new NotFoundError("Staff not found")

    if (before.userId === actorUserId) {
      throw new ValidationError("You cannot archive yourself", {
        code: "CANNOT_ARCHIVE_SELF",
      })
    }

    const after = await tx.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        user: { update: { isActive: false } },
      },
      include: STAFF_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId,
        action: "DELETE",
        entityType: "Staff",
        entityId: after.id,
        detail: {
          before: {
            staffActive: before.isActive,
            userActive: before.user.isActive,
          },
          after: {
            staffActive: after.isActive,
            userActive: after.user.isActive,
          },
          method: "soft-delete (isActive=false on Staff+User)",
        },
      },
      { tx },
    )
  })
}
