/**
 * LabResult domain helpers + service layer (BE-16).
 *
 * The `LabResult` model is one row per lab panel (CBC, LFT, Vit D, …) with
 * the per-analyte rows packed into an `analytes` JSONB array. We store the
 * panel as a single row rather than normalising into a per-analyte table
 * because clinic-scale volume is small and labs hand the data back panel
 * at a time — JSONB is the path of least friction.
 *
 * Service functions:
 *   - `createLabResult` — POST  /api/lab-results
 *   - `getLabResult`    — GET   /api/lab-results/:id
 *   - `listLabResults`  — GET   /api/lab-results?patientId=…
 *   - `updateLabResult` — PATCH /api/lab-results/:id
 *
 * Every read/write of a single result writes an AuditLog row per BE-23.
 * The list endpoint does NOT audit per row (would be noisy); it audits
 * the query itself with a `READ` row carrying `entityType="LabResult"`
 * and `entityId=null`.
 *
 * Out-of-range flag computation:
 *   For each analyte where the caller did NOT explicitly set `flag`, if
 *   the analyte's `value` is numeric AND both `refLow` / `refHigh` are
 *   present, the helper sets `flag` to:
 *     - LOW   when value < refLow
 *     - HIGH  when value > refHigh
 *     - NORMAL otherwise.
 *   `CRITICAL_*` is reserved for future panic-value support — the helper
 *   never emits it. Non-numeric values without an explicit flag pass
 *   through unflagged (the caller can mark them ABNORMAL if they want).
 */

import type { LabResult, Prisma } from "@prisma/client"
import { LabFlag, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import type {
  AnalyteInput,
  CreateLabResultInput,
  ListLabResultsQuery,
  UpdateLabResultInput,
} from "@/lib/validation/lab-result"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create or modify a lab result. */
const WRITE_ROLES: readonly Role[] = [Role.ADMIN, Role.DOCTOR, Role.RMO]

/**
 * Roles allowed to read a lab result. Any authenticated clinic role may
 * read — the patient-portal scope is not surfaced through these routes.
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

// ---------------------------------------------------------------------------
// Flag computation
// ---------------------------------------------------------------------------

/**
 * Walk an analytes array and compute the `flag` field for any entry where
 * the caller did NOT set one explicitly AND the entry has a numeric value
 * with both `refLow` / `refHigh` populated.
 *
 * The function is a pure transform — it returns a new array and never
 * mutates the input. Critical-range computation is intentionally out of
 * scope for BE-16; the lab can still send `flag: "CRITICAL_LOW"` and it
 * will be preserved verbatim.
 */
export function computeAnalyteFlags(
  analytes: readonly AnalyteInput[],
): AnalyteInput[] {
  return analytes.map((a) => {
    if (a.flag !== undefined) return { ...a }
    const numericValue = typeof a.value === "number" ? a.value : Number(a.value)
    const hasRange =
      typeof a.refLow === "number" && typeof a.refHigh === "number"
    if (!hasRange || !Number.isFinite(numericValue)) return { ...a }
    let flag: LabFlag = LabFlag.NORMAL
    if (numericValue < (a.refLow as number)) flag = LabFlag.LOW
    else if (numericValue > (a.refHigh as number)) flag = LabFlag.HIGH
    return { ...a, flag }
  })
}

// ---------------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------------

/**
 * Standard include shape — pulls in just enough patient + ordering-doctor
 * detail to render the lab-results list in the patient-detail view without
 * a follow-up roundtrip.
 */
const LAB_RESULT_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
    },
  },
  orderingDoctor: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const

export type LabResultWithRelations = Prisma.LabResultGetPayload<{
  include: typeof LAB_RESULT_INCLUDE
}>

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Best-effort audit write. Failures are logged and swallowed — a broken
 * audit row must not break the underlying read/write because the audit
 * subsystem is observability, not correctness.
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
        entityType: "LabResult",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[lab-result] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new lab result against a patient (and optionally a consultation).
 *
 *  - Validates the actor's role (`WRITE_ROLES`).
 *  - Verifies the patient exists; otherwise the FK error becomes a 404.
 *  - Computes any missing analyte flags server-side.
 *  - Writes a CREATE audit row in the same transaction.
 */
export async function createLabResult(
  input: CreateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create a lab result`,
    )
  }

  const analytes = computeAnalyteFlags(input.analytes ?? [])

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

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

    const created = await tx.labResult.create({
      data: {
        patientId: input.patientId,
        consultationId: input.consultationId,
        panelName: input.panelName,
        collectedAt: input.collectedAt,
        reportedAt: input.reportedAt,
        orderingDoctorId: input.orderingDoctorId,
        labName: input.labName,
        analytes: analytes as unknown as Prisma.InputJsonValue,
        summary: input.summary,
        attachmentKey: input.attachmentKey,
        attachmentMime: input.attachmentMime,
      },
      include: LAB_RESULT_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: {
        after: {
          id: created.id,
          patientId: created.patientId,
          panelName: created.panelName,
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
 * Fetch one lab result with patient + ordering-doctor summary.
 *
 *  - Throws `ForbiddenError` if the actor's role is not in `READ_ROLES`.
 *  - Throws `NotFoundError` if no row exists.
 *  - Writes a READ audit row (best-effort).
 */
export async function getLabResult(
  id: string,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view lab results`)
  }

  const row = await db.labResult.findUnique({
    where: { id },
    include: LAB_RESULT_INCLUDE,
  })
  if (!row) throw new NotFoundError("Lab result not found")

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

export type ListLabResultsResult = {
  items: LabResultWithRelations[]
  nextCursor: string | null
}

/**
 * List lab results for a patient or a consultation. Either `patientId`
 * or `consultationId` is required — the validator's `.refine` enforces
 * that and the route surfaces a 400.
 *
 * Ordering is `collectedAt desc, id desc` so the patient-detail view
 * shows newest results first; the cursor is the `id` of the last row
 * from the previous page.
 *
 * Writes a single READ audit row for the query (entityId=null) so we
 * have a record of who pulled the list, without exploding the audit
 * table on every bulk-fetch.
 */
export async function listLabResults(
  input: ListLabResultsQuery,
  actor: { userId: string; role: Role },
): Promise<ListLabResultsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view lab results`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.LabResultWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.consultationId) where.consultationId = input.consultationId

  const rows = await db.labResult.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ collectedAt: "desc" }, { id: "desc" }],
    include: LAB_RESULT_INCLUDE,
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
        consultationId: input.consultationId ?? null,
        count: rows.length,
      },
    },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Update (PATCH)
// ---------------------------------------------------------------------------

/**
 * Partial update.
 *
 *  - `analytes` (when present) replaces the existing array verbatim AFTER
 *    flag computation — there is no merge semantics here because each
 *    re-test ships a fresh full panel and partial-analyte edits are not a
 *    real workflow.
 *  - `consultationId` and the other nullable fields accept `null` to
 *    explicitly clear them.
 *  - Writes an UPDATE audit row with `{ before, after, patch }` so a
 *    reviewer can reconstruct what changed.
 */
export async function updateLabResult(
  id: string,
  input: UpdateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot modify a lab result`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.labResult.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Lab result not found")

    if (input.consultationId) {
      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: { id: true, patientId: true },
      })
      if (!consultation) throw new NotFoundError("Consultation not found")
      if (consultation.patientId !== before.patientId) {
        throw new ForbiddenError(
          "Consultation does not belong to the lab result's patient",
        )
      }
    }

    const data: Prisma.LabResultUpdateInput = {}

    if (input.consultationId !== undefined) {
      data.consultation =
        input.consultationId === null
          ? { disconnect: true }
          : { connect: { id: input.consultationId } }
    }
    if (input.panelName !== undefined) data.panelName = input.panelName
    if (input.collectedAt !== undefined) data.collectedAt = input.collectedAt
    if (input.reportedAt !== undefined) data.reportedAt = input.reportedAt
    if (input.orderingDoctorId !== undefined) {
      data.orderingDoctor =
        input.orderingDoctorId === null
          ? { disconnect: true }
          : { connect: { id: input.orderingDoctorId } }
    }
    if (input.labName !== undefined) data.labName = input.labName
    if (input.analytes !== undefined) {
      data.analytes = computeAnalyteFlags(
        input.analytes,
      ) as unknown as Prisma.InputJsonValue
    }
    if (input.summary !== undefined) data.summary = input.summary
    if (input.attachmentKey !== undefined) data.attachmentKey = input.attachmentKey
    if (input.attachmentMime !== undefined) data.attachmentMime = input.attachmentMime

    const after = await tx.labResult.update({
      where: { id },
      data,
      include: LAB_RESULT_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: after.id,
      detail: {
        before: {
          panelName: before.panelName,
          collectedAt: before.collectedAt,
          analytes: before.analytes,
          consultationId: before.consultationId,
        },
        after: {
          panelName: after.panelName,
          collectedAt: after.collectedAt,
          analytes: after.analytes,
          consultationId: after.consultationId,
        },
        patch: input as unknown as Prisma.InputJsonValue,
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { LabResult }
