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
import {
  AppointmentStatus,
  AssessmentBand,
  AssessmentSubmissionStatus,
  Role,
} from "@prisma/client"
import { randomUUID } from "node:crypto"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { ConflictError } from "@/lib/api"
import { recordAudit } from "@/lib/services/audit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_APPOINTMENT_TRANSITIONS,
  type AvailabilityQuery,
  type BookAppointmentInput,
  type CreateAppointmentInput,
  type ListAppointmentsQuery,
  type TransitionAppointmentInput,
  type UpdateAppointmentInput,
} from "@/lib/validation/appointment"
import { rolesFor } from "@/lib/rbac"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create or mutate appointments. */
const WRITE_ROLES: readonly Role[] = rolesFor("appointment:write")

/**
 * Roles allowed to read appointments. Wider than the write set — the
 * specialists need visibility into their own day even if they don't
 * book the slot themselves.
 */
const VIEW_ROLES: readonly Role[] = rolesFor("appointment:view")

/**
 * Roles that see the whole appointment book. Everyone else is scoped to
 * appointments assigned to their own staff profile — both in lists and on
 * single records (`assertAppointmentAccess`).
 */
const FULL_BOOK_ROLES: readonly Role[] = rolesFor("appointment:fullBook")

/**
 * Ownership gate for single-appointment access (detail, transition,
 * consultation, RMO summary, quiz…). ADMIN/RECEPTION pass; any other role
 * must be the staff member the appointment is assigned to.
 */
export async function assertAppointmentAccess(
  appointmentStaffId: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (FULL_BOOK_ROLES.includes(actor.role)) return
  const staff = await db.staff.findUnique({
    where: { userId: actor.userId },
    select: { id: true },
  })
  if (!staff || staff.id !== appointmentStaffId) {
    throw new ForbiddenError(
      "You can only access appointments assigned to you",
    )
  }
}

/** Statuses that "hold" a staff slot for conflict-check purposes. */
const SLOT_HOLDING_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.CONFIRMED,
]

/** Client band string → AssessmentBand enum (booking-attached quiz). */
const ASSESSMENT_BAND_MAP: Record<"optimal" | "mild" | "moderate" | "significant", AssessmentBand> = {
  optimal: AssessmentBand.OPTIMAL,
  mild: AssessmentBand.MILD,
  moderate: AssessmentBand.MODERATE,
  significant: AssessmentBand.SIGNIFICANT,
}

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

  // Account scoping: ADMIN and RECEPTION (front desk manages the whole
  // book) see everything; every other role only sees appointments assigned
  // to their own staff profile. This also overrides any caller-supplied
  // staffId so a non-admin can't list someone else's schedule.
  if (!FULL_BOOK_ROLES.includes(actor.role)) {
    const staff = await db.staff.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    })
    if (!staff) return { items: [], nextCursor: null }
    where.staffId = staff.id
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

  await assertAppointmentAccess(appointment.staffId, actor)

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

    await assertAppointmentAccess(before.staffId, actor)

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
// Availability + patient-self booking (BE-23)
// ---------------------------------------------------------------------------

/**
 * `listAvailability` — return the list of free `durationMins` slot
 * windows for `staffId` between `from` and `to`.
 *
 * Sprint-1 algorithm: enumerate fixed slots stepping by `durationMins`
 * starting at `from`, then filter out any whose [start, end) range
 * overlaps an existing slot-holding appointment. Clinic working-hours
 * overlay + per-doctor schedules land in BE-28; for now we trust the
 * caller's window.
 *
 * Returns at most 96 slots to bound the response size; the schema also
 * caps the window at 14 days.
 */
export async function listAvailability(
  query: AvailabilityQuery,
  actor: { userId: string; role: Role },
): Promise<{ start: Date; end: Date }[]> {
  if (!VIEW_ROLES.includes(actor.role) && actor.role !== Role.PATIENT) {
    throw new ForbiddenError(`Role ${actor.role} cannot view availability`)
  }

  const staff = await db.staff.findUnique({
    where: { id: query.staffId },
    select: { id: true },
  })
  if (!staff) throw new NotFoundError("Staff not found")

  const stepMs = query.durationMins * 60 * 1000
  const candidates: { start: Date; end: Date }[] = []
  for (
    let t = query.from.getTime();
    t + stepMs <= query.to.getTime() && candidates.length < 96;
    t += stepMs
  ) {
    candidates.push({ start: new Date(t), end: new Date(t + stepMs) })
  }
  if (candidates.length === 0) return []

  // Pull all slot-holding appointments overlapping the window in a
  // single query, then filter candidates in memory. Cheaper than N
  // per-slot conflict queries.
  const overlapping = await db.appointment.findMany({
    where: {
      staffId: query.staffId,
      status: { in: [...SLOT_HOLDING_STATUSES] },
      startsAt: { lt: query.to },
      endsAt: { gt: query.from },
    },
    select: { startsAt: true, endsAt: true },
  })

  return candidates.filter((slot) => {
    return !overlapping.some(
      (a) =>
        a.startsAt.getTime() < slot.end.getTime() &&
        a.endsAt.getTime() > slot.start.getTime(),
    )
  })
}

/**
 * `bookAppointmentForSelf` — patient self-book branch of BE-23.
 *
 * Resolves the patient via `Patient.userId`. Returns 403 if the
 * authenticated user has no linked patient record. Re-checks the slot
 * inside `db.$transaction` and creates a REQUESTED appointment.
 */
export async function bookAppointmentForSelf(
  input: BookAppointmentInput,
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    })
    if (!patient) {
      throw new ForbiddenError(
        "Your account is not linked to a patient record. Please contact the clinic.",
      )
    }
    return bookCore(
      tx,
      { ...input, patientId: patient.id },
      actor,
      "SELF",
    )
  })
}

/**
 * `bookAppointmentForPatient` — on-behalf branch of BE-23. Route layer
 * has already gated this to ADMIN / RECEPTION.
 */
export async function bookAppointmentForPatient(
  input: BookAppointmentInput & { patientId: string },
  actor: { userId: string; role: Role },
): Promise<AppointmentWithRelations> {
  return db.$transaction(async (tx) => {
    return bookCore(tx, input, actor, "ON_BEHALF")
  })
}

/**
 * Internal: shared booking logic for both self + on-behalf paths.
 * Validates staff exists, asserts the slot is free, creates the row
 * with REQUESTED status, writes the audit log.
 */
async function bookCore(
  tx: Prisma.TransactionClient,
  input: BookAppointmentInput & { patientId: string },
  actor: { userId: string; role: Role },
  channel: "SELF" | "ON_BEHALF",
): Promise<AppointmentWithRelations> {
  const startsAt = input.scheduledAt
  const endsAt = new Date(startsAt.getTime() + input.durationMins * 60 * 1000)

  const staff = await tx.staff.findUnique({
    where: { id: input.staffId },
    select: { id: true, departmentId: true, user: { select: { role: true } } },
  })
  if (!staff) throw new NotFoundError("Staff not found")

  // Triage rule: a patient self-booking always sees a Medical Officer
  // (RMO) first — they cannot book a doctor (e.g. Dr. Yuvraaj) directly.
  // Enforced here so a tampered request can't bypass the UI restriction.
  // Reception/on-behalf bookings are unaffected.
  if (channel === "SELF" && staff.user?.role !== Role.RMO) {
    throw new ForbiddenError(
      "Patients can only book a Medical Officer (RMO) for the first visit. They will route you to a specialist if needed.",
    )
  }

  const conflict = await hasSlotConflict({
    staffId: input.staffId,
    startsAt,
    endsAt,
    tx,
  })
  if (conflict) {
    throw new ConflictError(
      "That slot is no longer free — please pick another one.",
    )
  }

  // Resolve creator's Staff row (null for patient self-book).
  const actorStaff = await tx.staff.findUnique({
    where: { userId: actor.userId },
    select: { id: true },
  })

  const created = await tx.appointment.create({
    data: {
      patientId: input.patientId,
      staffId: input.staffId,
      departmentId: staff.departmentId,
      startsAt,
      endsAt,
      status: AppointmentStatus.REQUESTED,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      createdById: actorStaff?.id ?? null,
    },
    include: APPOINTMENT_INCLUDE,
  })

  // Quiz-first portal booking: persist the scored Health Assessment for the
  // same patient, stamped to the booked slot, so the RMO/Doctor see it on
  // this visit (the quiz view resolves the patient's latest submission).
  if (input.assessment) {
    const a = input.assessment
    const p = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { fullName: true, email: true, phone: true },
    })
    const preferredTime = `${String(startsAt.getHours()).padStart(2, "0")}:${String(
      startsAt.getMinutes(),
    ).padStart(2, "0")}`
    await tx.assessmentSubmission.create({
      data: {
        patientId: input.patientId,
        contactName: p?.fullName ?? "",
        contactEmail: p?.email ?? "",
        contactPhone: p?.phone ?? "",
        contactSex: a.sex,
        preferredAt: startsAt,
        preferredTime,
        notes:
          channel === "SELF"
            ? "Patient portal self-assessment"
            : "Assessment captured at booking",
        totalScore: a.totalScore,
        scoreOutOf: a.scoreOutOf,
        band: ASSESSMENT_BAND_MAP[a.band],
        byCategory: a.byCategory as unknown as Prisma.InputJsonValue,
        topRisks: a.topRisks as unknown as Prisma.InputJsonValue,
        suggestedFocus: a.suggestedFocus as unknown as Prisma.InputJsonValue,
        answers: a.answers as Prisma.InputJsonValue,
        bookingRef: `BOOK-${randomUUID().slice(0, 8).toUpperCase()}`,
        status: AssessmentSubmissionStatus.COMPLETED,
      },
    })
  }

  await recordAudit(
    {
      actorUserId: actor.userId,
      action: "CREATE",
      entityType: "Appointment",
      entityId: created.id,
      detail: {
        channel,
        patientId: created.patientId,
        staffId: created.staffId,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
      },
    },
    { tx },
  )

  return created
}

// ---------------------------------------------------------------------------
// Hard delete (permanent)
// ---------------------------------------------------------------------------

/**
 * Permanently delete an appointment. Irreversible. ADMIN-only.
 *
 * `Invoice.appointmentId` and `Appointment.consultationId` are `SetNull`, so a
 * linked invoice or consultation is detached — not deleted. Writes a DELETE
 * audit row with the deleted appointment snapshot.
 */
export async function deleteAppointment(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (actor.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may delete appointments")
  }
  await db.$transaction(async (tx) => {
    const before = await tx.appointment.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Appointment not found")

    await tx.appointment.delete({ where: { id } })

    await recordAudit(
      {
        actorUserId: actor.userId,
        action: "DELETE",
        entityType: "Appointment",
        entityId: id,
        detail: {
          before: before as unknown as Prisma.InputJsonValue,
          method: "hard-delete (permanent)",
        },
      },
      { tx },
    )
  })
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { Appointment }
