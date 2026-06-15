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
import { ConsultationType, TreatmentPlanStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/api/errors"
import { recordAudit } from "@/lib/services/audit"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { parseRxItem } from "@/lib/rx-library"

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
  dateOfBirth: true,
  sex: true,
  primaryDoctor: {
    select: { id: true, fullName: true },
  },
} as const

export type SelfProfile = Prisma.PatientGetPayload<{
  select: typeof SELF_PROFILE_SELECT
}> & {
  /** Known drug allergies from the patient's latest RMO intake, if any. */
  knownAllergies: string | null
}

/** Pull "Known Allergies" out of an RMO consultation's `sections` blob. */
function extractKnownAllergies(sections: Prisma.JsonValue | undefined | null): string | null {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return null
  const mh = (sections as Record<string, unknown>)["medicalHistory"]
  if (!mh || typeof mh !== "object" || Array.isArray(mh)) return null
  const v = (mh as Record<string, unknown>)["medical_history__known_allergies"]
  const s = v == null ? "" : String(v).trim()
  return s || null
}

/**
 * Return the calling patient's own profile. A read row is written
 * best-effort. Includes the latest known drug allergies so the portal can
 * surface a safety banner (mirrors the admin RMO Summary).
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

  // Latest RMO intake carries the captured allergy history.
  const consult = await db.consultation.findFirst({
    where: { patientId: args.patientId, type: ConsultationType.RMO },
    orderBy: { createdAt: "desc" },
    select: { sections: true },
  })
  const knownAllergies = extractKnownAllergies(consult?.sections)

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Patient",
    entityId: profile.id,
    detail: { scope: "self.profile" },
  })

  return { ...profile, knownAllergies }
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
  createdBy: { select: { id: true, staff: { select: { fullName: true, avatarUrl: true, specialization: true } } } },
  signedBy: { select: { id: true, staff: { select: { fullName: true, avatarUrl: true, specialization: true } } } },
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
  department: { select: { id: true, name: true } },
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

// ---------------------------------------------------------------------------
// Prescriptions (derived from the doctor's MAIN consultation Final Prescription)
// ---------------------------------------------------------------------------
//
// The patient portal "Prescriptions" surface is built around the `Plan`
// shape, but the actual prescribing happens inside the Dr. Yuvraaj MAIN
// consultation (stored in `Consultation.sections.finalPrescription`). This
// reads those consultations and projects each into a prescription the portal
// can list / open / print — without a separate TreatmentPlan write.

type RxRow = Record<string, string>

type PrescriptionDoctor = {
  id: string
  staff: { fullName: string; avatarUrl: string | null; specialization: string | null } | null
} | null

export type SelfPrescriptionItem = {
  id: string
  kind: "RX" | "SUPPLEMENT" | "IV" | "REHAB" | "AESTHETIC"
  name: string
  dose: string | null
  frequency: string | null
  durationDays: number | null
  instructions: string | null
}

export type SelfPrescription = {
  id: string
  title: string
  summary: string | null
  status: string
  version: number
  createdAt: Date
  signedBy: PrescriptionDoctor
  createdBy: PrescriptionDoctor
  items: SelfPrescriptionItem[]
}

/** Tolerant parse of a table control's stored JSON-string value. */
function parseRowsJson(v: unknown): RxRow[] {
  if (typeof v !== "string" || !v.trim()) return []
  try {
    const arr = JSON.parse(v)
    if (!Array.isArray(arr)) return []
    return arr.map((r) => (r && typeof r === "object" ? (r as RxRow) : {}))
  } catch {
    return []
  }
}

/** "12 Weeks" -> 84, "1 month" -> 30, "30 days" -> 30; unparseable -> null. */
function durationToDays(s: string | undefined): number | null {
  if (!s) return null
  const m = s.match(/(\d+(?:\.\d+)?)\s*(day|week|month|year)s?/i)
  if (!m) return null
  const n = Number.parseFloat(m[1])
  const unit = m[2].toLowerCase()
  const mult = unit === "day" ? 1 : unit === "week" ? 7 : unit === "month" ? 30 : 365
  return Math.round(n * mult)
}

function sectionField(sections: Prisma.JsonValue | null | undefined, key: string, field: string): string {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return ""
  const sec = (sections as Record<string, unknown>)[key]
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return ""
  const v = (sec as Record<string, unknown>)[field]
  return v == null ? "" : String(v).trim()
}

/**
 * Project a MAIN consultation into a portal prescription. Returns `null`
 * when the Final Prescription is empty (no diagnosis + no items) so blank
 * drafts don't surface to the patient.
 */
function shapePrescription(
  consult: { id: string; status: string; createdAt: Date; sections: Prisma.JsonValue | null },
  doctor: PrescriptionDoctor,
): SelfPrescription | null {
  const diagnosis = sectionField(consult.sections, "finalPrescription", "finalPrescription__diagnosis")
  const impression = sectionField(consult.sections, "finalPrescription", "finalPrescription__clinical_impression")

  const medRows = parseRowsJson(
    (consult.sections as Record<string, Record<string, unknown>> | null)?.finalPrescription?.[
      "finalPrescription__supplements_rows"
    ],
  )
  const infusionRows = parseRowsJson(
    (consult.sections as Record<string, Record<string, unknown>> | null)?.infusionRehabAesthetic?.[
      "infusionRehabAesthetic__infusion_rows"
    ],
  )

  const items: SelfPrescriptionItem[] = []
  medRows.forEach((r, i) => {
    let name = (r.product ?? "").trim()
    if (!name) return
    let dose = (r.dose ?? "").trim()
    let frequency = (r.timing ?? "").trim()
    // Older rows stored the whole "Name dose freq" string in the first
    // column; split it so dose/frequency render in their own cells.
    if (!dose && !frequency) {
      const parsed = parseRxItem(name)
      name = parsed.product
      dose = parsed.dose
      frequency = parsed.timing
    }
    items.push({
      id: `${consult.id}-m${i}`,
      kind: "RX",
      name,
      dose: dose || null,
      frequency: frequency || null,
      durationDays: durationToDays((r.duration ?? "").trim()),
      instructions: (r.duration ?? "").trim() || null,
    })
  })
  infusionRows.forEach((r, i) => {
    const name = (r.therapy ?? "").trim()
    if (!name) return
    items.push({
      id: `${consult.id}-i${i}`,
      kind: "IV",
      name,
      dose: (r.dose ?? "").trim() || null,
      frequency: (r.schedule ?? "").trim() || null,
      durationDays: null,
      instructions: (r.purpose ?? "").trim() || null,
    })
  })

  if (items.length === 0 && !diagnosis && !impression) return null

  return {
    id: consult.id,
    title: diagnosis || "Prescription",
    summary: [impression, diagnosis].filter(Boolean).join(" — ") || null,
    status: "SIGNED",
    version: 1,
    createdAt: consult.createdAt,
    signedBy: doctor,
    createdBy: doctor,
    items,
  }
}

/**
 * The calling patient's prescriptions, newest first. Built from MAIN
 * consultations that carry a Final Prescription. The prescribing doctor is
 * resolved from the linked appointment's assigned staff (not the consultation
 * creator, which may be an admin who opened the chart).
 */
export async function listSelfPrescriptions(args: {
  patientId: string
  actorUserId: string
  input: SelfListInput
}): Promise<SelfListResult<SelfPrescription>> {
  const take = clampLimit(args.input.limit)

  const consults = await db.consultation.findMany({
    where: { patientId: args.patientId, type: ConsultationType.MAIN },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.min(take * 2, MAX_PAGE_SIZE) + 1,
    select: { id: true, status: true, createdAt: true, sections: true },
  })

  // Map consultationId -> prescribing doctor via the linked appointment.
  const ids = consults.map((c) => c.id)
  const appts = ids.length
    ? await db.appointment.findMany({
        where: { patientId: args.patientId, consultationId: { in: ids } },
        select: {
          consultationId: true,
          staff: { select: { id: true, fullName: true, avatarUrl: true, specialization: true } },
        },
      })
    : []
  const doctorByConsult = new Map<string, PrescriptionDoctor>()
  for (const a of appts) {
    if (!a.consultationId) continue
    doctorByConsult.set(
      a.consultationId,
      a.staff
        ? { id: a.staff.id, staff: { fullName: a.staff.fullName, avatarUrl: a.staff.avatarUrl, specialization: a.staff.specialization } }
        : null,
    )
  }

  const all = consults
    .map((c) => shapePrescription(c, doctorByConsult.get(c.id) ?? null))
    .filter((p): p is SelfPrescription => p !== null)

  let nextCursor: string | null = null
  const items = all.slice(0, take)
  if (all.length > take) nextCursor = items[items.length - 1]?.id ?? null

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Consultation",
    entityId: args.patientId,
    detail: { scope: "self.prescriptions", count: items.length },
  })

  return { items, nextCursor }
}

export type SelfPrescriptionDetail = {
  id: string
  sections: Prisma.JsonValue | null
  patientName: string
  patientNumber: string
  updatedAt: string | null
}

/**
 * One prescription's raw consultation sections, scoped to the calling
 * patient — so the portal can render it with the same `PrescriptionSheet`
 * the admin uses. Hard-pinned to `patientId` + MAIN so a patient can never
 * read another patient's (or an RMO) chart.
 */
export async function getSelfPrescription(args: {
  patientId: string
  actorUserId: string
  consultationId: string
}): Promise<SelfPrescriptionDetail> {
  const consult = await db.consultation.findFirst({
    where: {
      id: args.consultationId,
      patientId: args.patientId,
      type: ConsultationType.MAIN,
    },
    select: {
      id: true,
      sections: true,
      updatedAt: true,
      patient: { select: { fullName: true, patientNumber: true } },
    },
  })
  if (!consult) throw new NotFoundError("Prescription not found")

  await recordAudit({
    actorUserId: args.actorUserId,
    action: "READ",
    entityType: "Consultation",
    entityId: consult.id,
    detail: { scope: "self.prescription" },
  })

  return {
    id: consult.id,
    sections: consult.sections,
    patientName: consult.patient?.fullName ?? "",
    patientNumber: consult.patient?.patientNumber ?? "",
    updatedAt: consult.updatedAt?.toISOString() ?? null,
  }
}
