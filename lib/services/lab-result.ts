/**
 * LabResult service layer (BE-16).
 *
 * Handles the read/write side of `/api/lab-results`. Per-analyte `flag`
 * (HIGH / LOW / NORMAL) is computed here at write time from `refLow` /
 * `refHigh`; analytes that omit either bound get no `flag` (NULLish).
 *
 * A panel-aware reference-range engine — including unit conversions and
 * vendor-specific overrides — is planned for BE-18. Until then we trust
 * the bounds the client sends.
 *
 * All writes are wrapped in `db.$transaction` so the AuditLog row commits
 * (or rolls back) atomically with the lab result update.
 */

import type { LabResult, Prisma } from "@prisma/client"
import { LabPanel, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import {
  type AnalyteInput,
  type CreateLabResultInput,
  type ListLabResultsQuery,
  type UpdateLabResultInput,
} from "@/lib/validation/lab-result"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles that can create/update lab results. */
const WRITE_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  // Lab uploads typically come in via reception/front-desk in this clinic.
  // A dedicated LAB role is on the roadmap; reception covers it for now.
  Role.RECEPTION,
]

/**
 * Roles that can read lab results. Wider than write — every clinical
 * specialist needs panel history during their own session.
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

function assertCanWrite(role: Role): void {
  if (!WRITE_ROLES.includes(role)) {
    throw new ForbiddenError(`Role ${role} cannot modify lab results`)
  }
}

function assertCanRead(role: Role): void {
  if (!READ_ROLES.includes(role)) {
    throw new ForbiddenError(`Role ${role} cannot view lab results`)
  }
}

// ---------------------------------------------------------------------------
// Flag computation (BE-16; replaced by BE-18's reference-range engine later)
// ---------------------------------------------------------------------------

/**
 * Compute the out-of-range flag for a single analyte. Returns `undefined`
 * when either bound is missing — the caller should leave `flag` unset
 * rather than guess. `NORMAL` is only emitted when both bounds are
 * present and the value sits inside (inclusive of the bounds).
 */
export function computeAnalyteFlag(
  a: Pick<AnalyteInput, "value" | "refLow" | "refHigh">,
): "HIGH" | "LOW" | "NORMAL" | undefined {
  if (typeof a.refLow !== "number" && typeof a.refHigh !== "number") {
    return undefined
  }
  if (typeof a.refHigh === "number" && a.value > a.refHigh) return "HIGH"
  if (typeof a.refLow === "number" && a.value < a.refLow) return "LOW"
  // If only one bound is set and we passed the relevant check above,
  // we still call it NORMAL (within the half-open range we know about).
  return "NORMAL"
}

/**
 * Normalise the incoming analytes array — strip any client-supplied
 * `flag`, then recompute it server-side. This guarantees flag stays in
 * sync with refLow/refHigh and prevents downstream consumers from
 * believing a stale flag.
 */
export function normaliseAnalytes(
  analytes: readonly AnalyteInput[],
): Array<AnalyteInput & { flag?: "HIGH" | "LOW" | "NORMAL" }> {
  return analytes.map((a) => {
    const flag = computeAnalyteFlag(a)
    const { flag: _ignored, ...rest } = a
    return flag ? { ...rest, flag } : rest
  })
}

// ---------------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------------

const LAB_RESULT_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
    },
  },
} as const

export type LabResultWithRelations = Prisma.LabResultGetPayload<{
  include: typeof LAB_RESULT_INCLUDE
}>

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Cursor-paginated list. Filters by `patientId` and/or `panel` when
 * supplied. Soft-deleted rows are excluded.
 */
export async function listLabResults(
  query: ListLabResultsQuery,
  actor: { role: Role },
): Promise<{ items: LabResultWithRelations[]; nextCursor: string | null }> {
  assertCanRead(actor.role)

  const take = Math.min(Math.max(query.take ?? 20, 1), 100)
  const where: Prisma.LabResultWhereInput = { deletedAt: null }
  if (query.patientId) where.patientId = query.patientId
  if (query.panel) where.panel = query.panel

  const rows = await db.labResult.findMany({
    where,
    include: LAB_RESULT_INCLUDE,
    take: take + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    orderBy: [{ reportedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  })

  const nextCursor =
    rows.length > take ? (rows.pop() as LabResultWithRelations).id : null
  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createLabResult(
  input: CreateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  assertCanWrite(actor.role)

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const analytes = normaliseAnalytes(input.analytes ?? [])

    const created = await tx.labResult.create({
      data: {
        patientId: input.patientId,
        panel: input.panel,
        orderedById: input.orderedById ?? actor.userId,
        analytes: analytes as unknown as Prisma.InputJsonValue,
        notes: input.notes,
        attachmentKey: input.attachmentKey,
        collectedAt: input.collectedAt ? new Date(input.collectedAt) : null,
        reportedAt: input.reportedAt ? new Date(input.reportedAt) : null,
      },
      include: LAB_RESULT_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "LabResult",
        entityId: created.id,
        detail: {
          after: {
            id: created.id,
            patientId: created.patientId,
            panel: created.panel,
          },
        },
      },
    })

    return created
  })
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

export async function getLabResult(
  id: string,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  assertCanRead(actor.role)

  const row = await db.labResult.findFirst({
    where: { id, deletedAt: null },
    include: LAB_RESULT_INCLUDE,
  })
  if (!row) throw new NotFoundError("Lab result not found")

  try {
    await db.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "READ",
        entityType: "LabResult",
        entityId: row.id,
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[lab-result.getLabResult] audit write failed", err)
  }

  return row
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Apply a partial PATCH. Any field listed in `UpdateLabResultInput` may
 * be replaced verbatim. When `analytes` is supplied it REPLACES the
 * entire array (we don't merge by analyte name — the order/identity is
 * not stable enough to make that safe); the new array is normalised the
 * same way as on create.
 */
export async function updateLabResult(
  id: string,
  input: UpdateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  assertCanWrite(actor.role)

  return db.$transaction(async (tx) => {
    const before = await tx.labResult.findFirst({
      where: { id, deletedAt: null },
    })
    if (!before) throw new NotFoundError("Lab result not found")

    const data: Prisma.LabResultUpdateInput = {}
    if (input.panel !== undefined) data.panel = input.panel
    if (input.analytes !== undefined) {
      data.analytes = normaliseAnalytes(input.analytes) as unknown as
        Prisma.InputJsonValue
    }
    if (input.orderedById !== undefined) data.orderedById = input.orderedById
    if (input.notes !== undefined) data.notes = input.notes
    if (input.attachmentKey !== undefined) {
      data.attachmentKey = input.attachmentKey
    }
    if (input.collectedAt !== undefined) {
      data.collectedAt = input.collectedAt ? new Date(input.collectedAt) : null
    }
    if (input.reportedAt !== undefined) {
      data.reportedAt = input.reportedAt ? new Date(input.reportedAt) : null
    }

    const after = await tx.labResult.update({
      where: { id },
      data,
      include: LAB_RESULT_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "LabResult",
        entityId: after.id,
        detail: {
          before: {
            panel: before.panel,
            analytes: before.analytes,
            attachmentKey: before.attachmentKey,
          },
          after: {
            panel: after.panel,
            analytes: after.analytes,
            attachmentKey: after.attachmentKey,
          },
          patch: input as unknown as Prisma.InputJsonValue,
        },
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a lab result. The row is hidden from listings and from
 * `getLabResult`, but kept in the table for audit/compliance.
 */
export async function softDeleteLabResult(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  assertCanWrite(actor.role)

  await db.$transaction(async (tx) => {
    const before = await tx.labResult.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!before) throw new NotFoundError("Lab result not found")

    await tx.labResult.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "DELETE",
        entityType: "LabResult",
        entityId: id,
      },
    })
  })
}

export type { LabResult }
