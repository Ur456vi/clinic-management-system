/**
 * InfusionLog service layer (BE-26).
 *
 * Owns the business rules for the `InfusionLog` model: role gating,
 * patient/consultation/staff existence checks, status-transition
 * validation, and audit-log writes. The route handlers in
 * `app/api/infusion-logs/**` are intentionally thin wrappers that parse
 * input and call into one of these functions.
 *
 * All writes are wrapped in `db.$transaction` so the AuditLog row commits
 * (or rolls back) atomically with the infusion-log mutation — matches the
 * pattern in `lib/services/appointment.ts` and `lib/services/lab-result.ts`.
 */

import type { InfusionLog, Prisma } from "@prisma/client"
import { InfusionStatus, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_INFUSION_TRANSITIONS,
  type CreateInfusionLogInput,
  type ListInfusionLogsQuery,
  type TransitionInfusionLogInput,
  type UpdateInfusionLogInput,
} from "@/lib/validation/infusion-log"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/**
 * Roles allowed to create / mutate / transition an infusion log.
 *
 * The PM brief calls for DOCTOR / RMO / NURSE; the `Role` enum has no
 * NURSE member, so we use `INFUSION_SPECIALIST` in its place (the role
 * spec'd for the same job in BE-03). ADMIN is granted for unblocking
 * cleanup operations.
 */
const WRITE_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.INFUSION_SPECIALIST,
]

/**
 * Roles allowed to read an infusion log. Any authenticated clinic role
 * may read — the patient-portal scope is not surfaced through these
 * routes.
 */
const READ_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
  Role.INFUSION_SPECIALIST,
  Role.REHAB_SPECIALIST,
  Role.AESTHETICS_SPECIALIST,
]

/**
 * Roles allowed to hard-delete an infusion log. Tight by design — soft
 * delete is `status = ABORTED`; hard delete is an admin-only escape
 * hatch for cleaning up test rows.
 */
const DELETE_ROLES: readonly Role[] = [Role.ADMIN]

// ---------------------------------------------------------------------------
// Include shape
// ---------------------------------------------------------------------------

/**
 * Standard include — patient summary + staff summary + consultation
 * stub. Mirrors the lab-result include so the FE renders both detail
 * pages with the same skeleton.
 */
const INFUSION_LOG_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
    },
  },
  staff: {
    select: {
      id: true,
      fullName: true,
      specialization: true,
      departmentId: true,
    },
  },
  consultation: {
    select: { id: true, type: true, status: true },
  },
} as const

export type InfusionLogWithRelations = Prisma.InfusionLogGetPayload<{
  include: typeof INFUSION_LOG_INCLUDE
}>

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Best-effort audit write. Failures are logged and swallowed — a broken
 * audit row must not break the underlying read because the audit
 * subsystem is observability, not correctness. For mutations the caller
 * passes the tx client so the audit row commits atomically with the
 * mutation.
 */
async function writeAudit(
  client: Prisma.TransactionClient | typeof db,
  args: {
    actorUserId: string
    action: "CREATE" | "READ" | "UPDATE" | "DELETE"
    entityId: string | null
    detail?: Prisma.InputJsonValue
  },
): Promise<void> {
  try {
    await client.auditLog.create({
      data: {
        actorUserId: args.actorUserId,
        action: args.action,
        entityType: "InfusionLog",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[infusion-log] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new infusion log against a patient (and optionally a
 * consultation), administered by a Staff member.
 *
 *  - Role gate: WRITE_ROLES.
 *  - Verifies patient, staff, (optional) consultation exist.
 *  - If a consultation is supplied, asserts it belongs to the same patient.
 *  - Writes a CREATE audit row in the same transaction.
 */
export async function createInfusionLog(
  input: CreateInfusionLogInput,
  actor: { userId: string; role: Role },
): Promise<InfusionLogWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create an infusion log`,
    )
  }

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const staff = await tx.staff.findUnique({
      where: { id: input.staffId },
      select: { id: true },
    })
    if (!staff) throw new NotFoundError("Staff not found")

    if (input.consultationId) {
      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: { id: true, patientId: true },
      })
      if (!consultation) throw new NotFoundError("Consultation not found")
      if (consultation.patientId !== input.patientId) {
        throw new ForbiddenError(
          "Consultation does not belong to the supplied patient",
        )
      }
    }

    const created = await tx.infusionLog.create({
      data: {
        patientId: input.patientId,
        consultationId: input.consultationId,
        staffId: input.staffId,
        protocol: input.protocol,
        agents: input.agents as unknown as Prisma.InputJsonValue,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        reaction: input.reaction,
        notes: input.notes,
        // status defaults to SCHEDULED via the schema.
      },
      include: INFUSION_LOG_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: {
        after: {
          id: created.id,
          patientId: created.patientId,
          staffId: created.staffId,
          protocol: created.protocol,
          status: created.status,
        },
      },
    })

    return created
  })
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

/**
 * Fetch one infusion log with patient + staff + consultation summary.
 * Writes a READ audit row (best-effort).
 */
export async function getInfusionLog(
  id: string,
  actor: { userId: string; role: Role },
): Promise<InfusionLogWithRelations> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view infusion logs`)
  }

  const row = await db.infusionLog.findUnique({
    where: { id },
    include: INFUSION_LOG_INCLUDE,
  })
  if (!row) throw new NotFoundError("Infusion log not found")

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: row.id,
  })

  return row
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListInfusionLogsResult = {
  items: InfusionLogWithRelations[]
  nextCursor: string | null
}

/**
 * Filter / paginate infusion logs.
 *
 * Order is `startedAt desc, id desc` — newest first for the
 * patient-detail view, with the trailing `id` tiebreaker for a stable
 * cursor. The cursor is the `id` of the last row of the previous page;
 * we over-fetch by one so we know if a next page exists without a
 * second query.
 *
 * Writes a single READ audit row for the query (entityId=null) so we
 * have a record of who pulled the list, without exploding the audit
 * table on every bulk-fetch.
 */
export async function listInfusionLogs(
  input: ListInfusionLogsQuery,
  actor: { userId: string; role: Role },
): Promise<ListInfusionLogsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view infusion logs`)
  }

  const take = Math.min(
    (input as { limit?: number }).limit ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  )

  const where: Prisma.InfusionLogWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.staffId) where.staffId = input.staffId
  if (input.status) where.status = { in: input.status }
  if (input.from || input.to) {
    where.startedAt = {}
    if (input.from) (where.startedAt as Prisma.DateTimeFilter).gte = input.from
    if (input.to) (where.startedAt as Prisma.DateTimeFilter).lt = input.to
  }

  const rows = await db.infusionLog.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    include: INFUSION_LOG_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: null,
    detail: {
      query: {
        patientId: input.patientId ?? null,
        staffId: input.staffId ?? null,
        status: input.status ?? null,
        count: rows.length,
      },
    },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Update (PATCH) — content fields only
// ---------------------------------------------------------------------------

/**
 * Apply a partial PATCH. Status changes do **not** go through this
 * endpoint — see `transitionInfusionLog` below.
 *
 *  - Terminal statuses (COMPLETED / ABORTED) reject content edits.
 *  - When both `startedAt` and `completedAt` end up set, asserts
 *    `completedAt > startedAt`.
 *  - Writes an UPDATE audit row with `{ before, after, patch }`.
 */
export async function updateInfusionLog(
  id: string,
  input: UpdateInfusionLogInput,
  actor: { userId: string; role: Role },
): Promise<InfusionLogWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot modify an infusion log`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.infusionLog.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Infusion log not found")

    if (
      before.status === InfusionStatus.COMPLETED ||
      before.status === InfusionStatus.ABORTED
    ) {
      throw new ValidationError(
        `Infusion log is ${before.status} and cannot be modified`,
      )
    }

    if (input.consultationId) {
      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: { id: true, patientId: true },
      })
      if (!consultation) throw new NotFoundError("Consultation not found")
      if (consultation.patientId !== before.patientId) {
        throw new ForbiddenError(
          "Consultation does not belong to the infusion log's patient",
        )
      }
    }

    const nextStartedAt = input.startedAt ?? before.startedAt
    const rawCompleted =
      input.completedAt !== undefined ? input.completedAt : before.completedAt
    if (
      rawCompleted &&
      rawCompleted.getTime() <= nextStartedAt.getTime()
    ) {
      throw new ValidationError("completedAt must be after startedAt")
    }

    const data: Prisma.InfusionLogUpdateInput = {}
    if (input.consultationId !== undefined) {
      data.consultation =
        input.consultationId === null
          ? { disconnect: true }
          : { connect: { id: input.consultationId } }
    }
    if (input.protocol !== undefined) data.protocol = input.protocol
    if (input.agents !== undefined) {
      data.agents = input.agents as unknown as Prisma.InputJsonValue
    }
    if (input.startedAt !== undefined) data.startedAt = input.startedAt
    if (input.completedAt !== undefined) data.completedAt = input.completedAt
    if (input.reaction !== undefined) data.reaction = input.reaction
    if (input.notes !== undefined) data.notes = input.notes

    const after = await tx.infusionLog.update({
      where: { id },
      data,
      include: INFUSION_LOG_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: after.id,
      detail: {
        before: {
          protocol: before.protocol,
          startedAt: before.startedAt.toISOString(),
          completedAt: before.completedAt?.toISOString() ?? null,
          reaction: before.reaction,
          notes: before.notes,
          consultationId: before.consultationId,
        },
        after: {
          protocol: after.protocol,
          startedAt: after.startedAt.toISOString(),
          completedAt: after.completedAt?.toISOString() ?? null,
          reaction: after.reaction,
          notes: after.notes,
          consultationId: after.consultationId,
        },
        patch: input as unknown as Prisma.InputJsonValue,
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Transition (status machine)
// ---------------------------------------------------------------------------

/**
 * Apply a status transition.
 *
 *   SCHEDULED   -> IN_PROGRESS | ABORTED
 *   IN_PROGRESS -> COMPLETED   | ABORTED
 *   COMPLETED / ABORTED are terminal.
 *
 * Side-effects:
 *   - SCHEDULED  -> IN_PROGRESS : refresh `startedAt = now()` if the
 *                                 caller previously back-dated it, so
 *                                 the timestamp reflects the actual
 *                                 start of administration. (We only
 *                                 stamp on transition; the create path
 *                                 still accepts an explicit `startedAt`
 *                                 for back-fill.)
 *   - IN_PROGRESS -> COMPLETED  : stamp `completedAt = now()` if unset.
 *   - * -> ABORTED              : stamp `completedAt = now()` (closing
 *                                 the row) and record `reaction` from
 *                                 the body, if supplied.
 *
 * Writes an UPDATE audit row tagged with the from/to transition.
 */
export async function transitionInfusionLog(
  id: string,
  input: TransitionInfusionLogInput,
  actor: { userId: string; role: Role },
): Promise<InfusionLogWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot transition infusion logs`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.infusionLog.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Infusion log not found")

    if (before.status === input.to) {
      throw new ValidationError(
        `Infusion log is already ${before.status}`,
      )
    }

    const allowed = ALLOWED_INFUSION_TRANSITIONS[before.status] ?? []
    if (!allowed.includes(input.to)) {
      throw new ValidationError(
        `Illegal transition: ${before.status} -> ${input.to}`,
      )
    }

    const now = new Date()
    const data: Prisma.InfusionLogUpdateInput = { status: input.to }

    if (input.to === InfusionStatus.IN_PROGRESS) {
      // Only stamp when we don't already have a real start.
      if (before.startedAt.getTime() > now.getTime()) {
        data.startedAt = now
      }
    }
    if (input.to === InfusionStatus.COMPLETED && !before.completedAt) {
      data.completedAt = now
    }
    if (input.to === InfusionStatus.ABORTED) {
      if (!before.completedAt) data.completedAt = now
      if (input.reason) data.reaction = input.reason
    }

    const after = await tx.infusionLog.update({
      where: { id },
      data,
      include: INFUSION_LOG_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: after.id,
      detail: {
        transition: { from: before.status, to: after.status },
        reason: input.reason ?? null,
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Delete (hard) — ADMIN only
// ---------------------------------------------------------------------------

/**
 * Hard-delete an infusion log. Restricted to ADMIN — operational escape
 * hatch for cleaning up test data. The expected soft-delete path is to
 * transition the row to ABORTED via the transition endpoint, which
 * preserves clinical history.
 *
 * Writes a DELETE audit row in the same transaction.
 */
export async function deleteInfusionLog(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!DELETE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot delete infusion logs`,
    )
  }

  await db.$transaction(async (tx) => {
    const before = await tx.infusionLog.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Infusion log not found")

    await tx.infusionLog.delete({ where: { id } })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "DELETE",
      entityId: id,
      detail: {
        before: {
          id: before.id,
          patientId: before.patientId,
          staffId: before.staffId,
          status: before.status,
        },
      },
    })
  })
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { InfusionLog }
