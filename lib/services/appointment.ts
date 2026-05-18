/**
 * Appointment service layer (BE-27).
 *
 * Owns the business rules for the `Appointment` model: slot-conflict
 * checks, status-transition validation, and audit-log writes. The route
 * handlers in `app/api/appointments/**` are intentionally thin wrappers
 * that parse input and call into one of these functions.
 *
 * The slot-conflict helper (`hasSlotConflict`) is exported so BE-28
 * (scheduling logic / suggested slots) can reuse the same overlap rule
 * without round-tripping through the route layer.
 *
 * All writes are wrapped in `db.$transaction` so the AuditLog row commits
 * (or rolls back) atomically with the appointment mutation — matches the
 * pattern in `lib/services/consultation.ts`.
 */

import type { Appointment, Prisma } from "@prisma/client"
import { AppointmentStatus, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { ConflictError } from "@/lib/api"
import { recordAudit } from "@/lib/services/audit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_APPOINTMENT_TRANSITIONS,
  type CreateAppointmentInput,
  type ListAppointmentsQuery,
  type TransitionAppointmentInput,
  type UpdateAppointmentInput,
} from "@/lib/validation/appointment"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create or mutate appointments. */
const WRITE_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
]

/**
 * Roles allowed to read appointments. Wider than the write set — the
 * specialists need visibility into their own day even if they don't
 * book the slot themselves.
 */
const VIEW_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
  Role.INFUSION_SPECIALIST,
  Role.REHAB_SPECIALIST,
  Role.AESTHETICS_SPECIALIST,
]

/** Statuses that "hold" a staff slot for conflict-check purposes. */
const SLOT_HOLDING_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
]

// ---------------------------------------------------------------------------
// Include shape
// ---------------------------------------------------------------------------

/**
 * Standard include — patient summary + staff summary + creator. Mirrors
 * the consultation include so the FE renders both detail pages with the
 * same skeleton.
 */
const APPOINTMENT_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      sex: true,
      dateOfBirth: true,
      status: true,
      primaryDoctorId: true,
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
  department: {
    select: { id: true, name: true, slug: true },
  },
  createdBy: {
    select: { id: true, fullName: true },
  },
} as const

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof APPOINTMENT_INCLUDE
}>

// ---------------------------------------------------------------------------
// Slot-conflict helper — exported for BE-28 reuse.
// ---------------------------------------------------------------------------

/**
 * Returns true when any existing appointment for `staffId` overlaps the
 * half-open interval `[startsAt, endsAt)` and is in a slot-holding
 * status (REQUESTED or CONFIRMED). Pass `excludeId` when editing an
 * existing row so it doesn't conflict with itself.
 *
 * Overlap rule: two intervals `[a, b)` and `[c, d)` overlap iff
 *   a < d  AND  c < b
 * which translates to the Prisma where below.
 */
export async function hasSlotConflict(args: {
  staffId: string
  startsAt: Date
  endsAt: Date
  excludeId?: string
  tx?: Prisma.TransactionClient
}): Promise<boolean> {
  const client = args.tx ?? db
  const conflict = await client.appointment.findFirst({
    where: {
      staffId: args.staffId,
      status: { in: [...SLOT_HOLDING_STATUSES] },
      startsAt: { lt: args.endsAt },
      endsAt: { gt: args.startsAt },
      ...(args.excludeId ? { NOT: { id: args.excludeId } } : {}),
    },
    select: { id: true },
  })
  return conflict !== null
}

function assertSlotFree(args: {
  staffId: string
  startsAt: Date
  endsAt: Date
  excludeId?: string
  tx: Prisma.TransactionClient
}) {
  return hasSlotConflict(args).then((conflict) => {
    if (conflict) {
      throw new ConflictError(
        "Requested slot overlaps an existing appointment for this staff member",
        { code: "SLOT_CONFLICT" },
      )
    }
  })
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a REQUESTED appointment.
 *
 *  - Role gate: WRITE_ROLES (ADMIN / DOCTOR / RMO / RECEPTION).
 *  - Verifies patient + staff (+ department, if supplied) exist.
 *  - Runs slot-conflict check inside the transaction.
 *  - Writes a CREATE audit row.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create appointments`,
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

    if (input.departmentId) {
      const dept = await tx.department.findUnique({
        where: { id: input.departmentId },
        select: { id: true },
      })
      if (!dept) throw new NotFoundError("Department not found")
    }

    // Resolve the creator's Staff row (the `createdBy` FK is Staff, not User).
    // Patients booking from the unified portal would not have a Staff row;
    // we tolerate that by leaving createdById null.
    const actorStaff = await tx.staff.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    })

    await assertSlotFree({
      staffId: input.staffId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      tx,
    })

    const created = await tx.appointment.create({
      data: {
        patientId: input.patientId,
        staffId: input.staffId,
        departmentId: input.departmentId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: AppointmentStatus.REQUESTED,
        reason: input.reason,
        notes: input.notes,
        createdById: actorStaff?.id ?? null,
      },
      include: APPOINTMENT_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "Appointment",
        entityId: created.id,
        detail: {
          after: {
            id: created.id,
            patientId: created.patientId,
            staffId: created.staffId,
            startsAt: created.startsAt.toISOString(),
            endsAt: created.endsAt.toISOString(),
            status: created.status,
          },
        },
      },
      { tx },
    )

    return created
  })
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListAppointmentsResult = {
  items: AppointmentWithRelations[]
  nextCursor: string | null
}

/**
 * Filter / paginate appointments.
 *
 * Order is `startsAt asc, id asc` — calendar-natural, and stable thanks
 * to the trailing `id` tiebreaker. The cursor is the `id` of the last
 * row of the previous page; we over-fetch by one so we know if a next
 * page exists without a second query.
 */
export async function listAppointments(
  input: ListAppointmentsQuery,
  actor: { userId: string; role: Role },
): Promise<ListAppointmentsResult> {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot view appointments`,
    )
  }

  const take = Math.min(
    (input as { limit?: number }).limit ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  )

  const where: Prisma.AppointmentWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.staffId) where.staffId = input.staffId
  if (input.departmentId) where.departmentId = input.departmentId
  if (input.status) where.status = { in: input.status }
  if (input.from || input.to) {
    where.startsAt = {}
    if (input.from) (where.startsAt as Prisma.DateTimeFilter).gte = input.from
    if (input.to) (where.startsAt as Prisma.DateTimeFilter).lt = input.to
  }

  const rows = await db.appointment.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: APPOINTMENT_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

/**
 * Fetch one appointment with patient + staff summary. Writes a READ
 * audit row (best-effort — audit failures do not block the read).
 */
export async function getAppointment(
  id: string,
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot view appointments`,
    )
  }

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: APPOINTMENT_INCLUDE,
  })
  if (!appointment) throw new NotFoundError("Appointment not found")

  await recordAudit({
    actorUserId: actor.userId,
    action: "READ",
    entityType: "Appointment",
    entityId: appointment.id,
  })

  return appointment
}

// ---------------------------------------------------------------------------
// Update (PATCH) — time / reason / notes only
// ---------------------------------------------------------------------------

/**
 * Apply a partial PATCH. Status changes do **not** go through this
 * endpoint — see `transitionAppointment` below for that.
 *
 *  - Re-runs slot-conflict check when either time bound changes.
 *  - 409 SLOT_CONFLICT on overlap; 400 on `endsAt <= startsAt`.
 *  - Terminal statuses (COMPLETED / CANCELLED / NO_SHOW) reject edits.
 *  - Writes an UPDATE audit row with `{ before, after, patch }`.
 */
export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot modify appointments`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.appointment.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Appointment not found")

    if (
      before.status === AppointmentStatus.COMPLETED ||
      before.status === AppointmentStatus.CANCELLED ||
      before.status === AppointmentStatus.NO_SHOW
    ) {
      throw new ValidationError(
        `Appointment is ${before.status} and cannot be modified`,
      )
    }

    const nextStartsAt = input.startsAt ?? before.startsAt
    const nextEndsAt = input.endsAt ?? before.endsAt

    if (nextEndsAt.getTime() <= nextStartsAt.getTime()) {
      throw new ValidationError("endsAt must be after startsAt")
    }

    const timeChanged =
      input.startsAt !== undefined || input.endsAt !== undefined
    if (timeChanged) {
      await assertSlotFree({
        staffId: before.staffId,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        excludeId: before.id,
        tx,
      })
    }

    const data: Prisma.AppointmentUpdateInput = {}
    if (input.startsAt !== undefined) data.startsAt = input.startsAt
    if (input.endsAt !== undefined) data.endsAt = input.endsAt
    if (input.reason !== undefined) data.reason = input.reason
    if (input.notes !== undefined) data.notes = input.notes

    const after = await tx.appointment.update({
      where: { id },
      data,
      include: APPOINTMENT_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "Appointment",
        entityId: after.id,
        detail: {
          before: {
            startsAt: before.startsAt.toISOString(),
            endsAt: before.endsAt.toISOString(),
            reason: before.reason,
            notes: before.notes,
          },
          after: {
            startsAt: after.startsAt.toISOString(),
            endsAt: after.endsAt.toISOString(),
            reason: after.reason,
            notes: after.notes,
          },
          patch: {
            startsAt: input.startsAt?.toISOString(),
            endsAt: input.endsAt?.toISOString(),
            reason: input.reason,
            notes: input.notes,
          },
        },
      },
      { tx },
    )

    return after
  })
}

// ---------------------------------------------------------------------------
// Transition (status machine)
// ---------------------------------------------------------------------------

/**
 * Apply a status transition.
 *
 *   REQUESTED  -> CONFIRMED | CANCELLED
 *   CONFIRMED  -> COMPLETED | CANCELLED | NO_SHOW
 *   COMPLETED / CANCELLED / NO_SHOW are terminal.
 *
 * On CANCELLED, stamps `cancelledAt = now()` and stores `cancelledReason`.
 * Other transitions clear neither (so we don't accidentally drop history
 * if a row bounces through CANCELLED in the future — which it can't, but
 * the defensive code costs nothing).
 *
 * Writes an UPDATE audit row tagged with the from/to transition.
 */
export async function transitionAppointment(
  id: string,
  input: TransitionAppointmentInput,
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot transition appointments`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.appointment.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Appointment not found")

    if (before.status === input.to) {
      throw new ValidationError(
        `Appointment is already ${before.status}`,
      )
    }

    const allowed = ALLOWED_APPOINTMENT_TRANSITIONS[before.status] ?? []
    if (!allowed.includes(input.to)) {
      throw new ValidationError(
        `Illegal transition: ${before.status} -> ${input.to}`,
      )
    }

    const data: Prisma.AppointmentUpdateInput = { status: input.to }
    if (input.to === AppointmentStatus.CANCELLED) {
      data.cancelledAt = new Date()
      data.cancelledReason = input.reason ?? null
    }

    const after = await tx.appointment.update({
      where: { id },
      data,
      include: APPOINTMENT_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "Appointment",
        entityId: after.id,
        detail: {
          transition: { from: before.status, to: after.status },
          reason: input.reason ?? null,
        },
      },
      { tx },
    )

    return after
  })
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { Appointment }
