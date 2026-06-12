/**
 * Patient-self service layer (BE-50).
 *
 * Backs the `/api/patient/me/*` endpoints. Every function here takes the
 * caller's resolved `patientId` (from `requirePatientSession()` in the
 * route) and uses it as a hard-pinned filter — there is no admin path,
 * no `patientId` override, and no way for a PATIENT-role caller to
 * surface anyone else's data through this module.
 *
 * READ audit rows are written for each call so the data-access policy
 * is satisfied (the patient is the actor and also the subject).
 *
 * Pagination follows the same cursor convention used by the staff-facing
 * list services (see `lib/services/appointment.ts`,
 * `…/treatment-plan.ts`, `…/invoice.ts`). Take is clamped to
 * `[1, MAX_PAGE_SIZE]`.
 */

import type { Prisma } from "@prisma/client"
import { TreatmentPlanStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/api/errors"
import { recordAudit } from "@/lib/services/audit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type SelfListInput = {
  /** Page size; defaults to DEFAULT_PAGE_SIZE, clamped to MAX_PAGE_SIZE. */
  limit?: number
  /** Opaque cursor from the previous page. */
  cursor?: string | null
}

export type SelfListResult<T> = {
  items: T[]
  nextCursor: string | null
}

function clampLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(limit), MAX_PAGE_SIZE)
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const SELF_PROFILE_SELECT = {
  id: true,
  patientNumber: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  primaryDoctor: {
    select: { id: true, fullName: true },
  },
} as const

export type SelfProfile = Prisma.PatientGetPayload<{
  select: typeof SELF_PROFILE_SELECT
}>

/**
 * Return the calling patient's own profile. A read row is written
 * best-effort.
 */
export async function getSelfProfile(args: {
  patientId: string
  actorUserId: string
}): Promise<SelfProfile> {
  const profile = await db.patient.findUnique({
    where: { id: args.patientId },
    select: SELF_PROFILE_SELECT,
  })
  if (!profile) {
    // Should be impossible given requirePatientSession() resolved a
    // Patient row, but guard anyway so we never return null.
    throw new NotFoundError("Patient profile not found")
  }

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Patient",
    entityId: profile.id,
    detail: { scope: "self.profile" },
  })

  return profile
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

const SELF_APPOINTMENT_INCLUDE = {
  // Staff carries the display name + specialization; `role` lives on the
  // linked User, not Staff, so it's intentionally not selected here.
  staff: { select: { id: true, fullName: true, specialization: true } },
  department: { select: { id: true, name: true } },
} as const

export type SelfAppointment = Prisma.AppointmentGetPayload<{
  include: typeof SELF_APPOINTMENT_INCLUDE
}>

export async function listSelfAppointments(args: {
  patientId: string
  actorUserId: string
  input: SelfListInput
}): Promise<SelfListResult<SelfAppointment>> {
  const take = clampLimit(args.input.limit)

  const rows = await db.appointment.findMany({
    where: { patientId: args.patientId },
    take: take + 1,
    ...(args.input.cursor
      ? { cursor: { id: args.input.cursor }, skip: 1 }
      : {}),
    // Soonest upcoming first matches the patient-timeline view used in
    // the May 28 demo walkthrough.
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    include: SELF_APPOINTMENT_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Appointment",
    entityId: args.patientId,
    detail: { scope: "self.appointments", count: rows.length },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Treatment plans
// ---------------------------------------------------------------------------

const SELF_PLAN_INCLUDE = {
  items: { orderBy: { createdAt: "asc" as const } },
  // A User has no `fullName` — read the clinician's name off their Staff row.
  createdBy: { select: { id: true, staff: { select: { fullName: true } } } },
  signedBy: { select: { id: true, staff: { select: { fullName: true } } } },
} as const

export type SelfTreatmentPlan = Prisma.TreatmentPlanGetPayload<{
  include: typeof SELF_PLAN_INCLUDE
}>

/**
 * Patients see only plans that are SIGNED or REVOKED. DRAFT plans are
 * a clinician work-in-progress and intentionally hidden.
 */
export async function listSelfTreatmentPlans(args: {
  patientId: string
  actorUserId: string
  input: SelfListInput
}): Promise<SelfListResult<SelfTreatmentPlan>> {
  const take = clampLimit(args.input.limit)

  const rows = await db.treatmentPlan.findMany({
    where: {
      patientId: args.patientId,
      status: {
        in: [TreatmentPlanStatus.SIGNED, TreatmentPlanStatus.REVOKED],
      },
    },
    take: take + 1,
    ...(args.input.cursor
      ? { cursor: { id: args.input.cursor }, skip: 1 }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: SELF_PLAN_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "TreatmentPlan",
    entityId: args.patientId,
    detail: { scope: "self.treatmentPlans", count: rows.length },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Lab results
// ---------------------------------------------------------------------------

const SELF_LAB_INCLUDE = {
  orderingDoctor: { select: { id: true, fullName: true } },
} as const

export type SelfLabResult = Prisma.LabResultGetPayload<{
  include: typeof SELF_LAB_INCLUDE
}>

/**
 * `LabResult` has no status enum (see schema.prisma BE-16 comment).
 * Finalization is signalled by `reportedAt` being set — we hide rows
 * still awaiting a report from the patient view.
 */
export async function listSelfLabResults(args: {
  patientId: string
  actorUserId: string
  input: SelfListInput
}): Promise<SelfListResult<SelfLabResult>> {
  const take = clampLimit(args.input.limit)

  const rows = await db.labResult.findMany({
    where: {
      patientId: args.patientId,
      reportedAt: { not: null },
    },
    take: take + 1,
    ...(args.input.cursor
      ? { cursor: { id: args.input.cursor }, skip: 1 }
      : {}),
    orderBy: [{ collectedAt: "desc" }, { id: "desc" }],
    include: SELF_LAB_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "LabResult",
    entityId: args.patientId,
    detail: { scope: "self.labResults", count: rows.length },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

const SELF_INVOICE_INCLUDE = {
  items: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { receivedAt: "desc" as const } },
} as const

export type SelfInvoice = Prisma.InvoiceGetPayload<{
  include: typeof SELF_INVOICE_INCLUDE
}>

export async function listSelfInvoices(args: {
  patientId: string
  actorUserId: string
  input: SelfListInput
}): Promise<SelfListResult<SelfInvoice>> {
  const take = clampLimit(args.input.limit)

  const rows = await db.invoice.findMany({
    where: { patientId: args.patientId },
    take: take + 1,
    ...(args.input.cursor
      ? { cursor: { id: args.input.cursor }, skip: 1 }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: SELF_INVOICE_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Invoice",
    entityId: args.patientId,
    detail: { scope: "self.invoices", count: rows.length },
  })

  return { items: rows, nextCursor }
}
