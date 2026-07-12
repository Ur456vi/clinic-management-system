/**
 * Vital Assessment service (patient-chart "Vital Assessment" tab).
 *
 * A vital assessment is one capture of the IPHMH Patient Assessment Sheet:
 * a date, optional consultant + note, and a map of the 26 sheet field values
 * (stored as JSON, keyed by `lib/vital-assessment-fields.ts`). A patient can
 * have many, newest first. Mirrors the Infusion service (role gates, audit).
 *
 *   - `createVitalAssessment` — POST   /api/vital-assessments
 *   - `listVitalAssessments`  — GET    /api/vital-assessments?patientId=…
 *   - `updateVitalAssessment` — PATCH  /api/vital-assessments/:id
 *   - `deleteVitalAssessment` — DELETE /api/vital-assessments/:id
 */

import type { Prisma } from "@prisma/client"
import { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { rolesFor } from "@/lib/rbac"
import { VITAL_ASSESSMENT_KEYS } from "@/lib/vital-assessment-fields"
import type {
  CreateVitalAssessmentInput,
  ListVitalAssessmentsQuery,
  UpdateVitalAssessmentInput,
} from "@/lib/validation/vital-assessment"

const WRITE_ROLES: readonly Role[] = rolesFor("vitalAssessment:write")
const READ_ROLES: readonly Role[] = rolesFor("vitalAssessment:read")
const DELETE_ROLES: readonly Role[] = rolesFor("vitalAssessment:delete")

/** Keep only known field keys with a non-empty trimmed value. */
function sanitizeMeasurements(input: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!input) return out
  for (const [k, v] of Object.entries(input)) {
    if (!VITAL_ASSESSMENT_KEYS.has(k)) continue
    const val = typeof v === "string" ? v.trim() : ""
    if (val) out[k] = val
  }
  return out
}

/** Best-effort audit write (observability, never breaks the write). */
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
        entityType: "VitalAssessment",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    console.error("[vital-assessment] audit write failed", err)
  }
}

export type VitalAssessmentListItem = {
  id: string
  assessedAt: string
  consultant: string | null
  note: string | null
  measurements: Record<string, string>
  createdByName: string | null
  createdAt: string
}

const vitalAssessmentInclude = {
  createdBy: { select: { staff: { select: { fullName: true } }, email: true } },
} satisfies Prisma.VitalAssessmentInclude

type VitalAssessmentRow = Prisma.VitalAssessmentGetPayload<{ include: typeof vitalAssessmentInclude }>

function toMeasurements(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (VITAL_ASSESSMENT_KEYS.has(k) && v != null) out[k] = String(v)
  }
  return out
}

function toListItem(r: VitalAssessmentRow): VitalAssessmentListItem {
  return {
    id: r.id,
    assessedAt: r.assessedAt.toISOString(),
    consultant: r.consultant,
    note: r.note,
    measurements: toMeasurements(r.measurements),
    createdByName: r.createdBy?.staff?.fullName ?? r.createdBy?.email ?? null,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function createVitalAssessment(
  input: CreateVitalAssessmentInput,
  actor: { userId: string; role: Role },
): Promise<VitalAssessmentListItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot create a vital assessment`)
  }

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const created = await tx.vitalAssessment.create({
      data: {
        patientId: input.patientId,
        assessedAt: input.assessedAt,
        consultant: input.consultant ?? null,
        note: input.note ?? null,
        measurements: sanitizeMeasurements(input.measurements),
        createdById: actor.userId,
      },
      include: vitalAssessmentInclude,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: { after: { id: created.id, patientId: created.patientId } },
    })

    return toListItem(created)
  })
}

export type ListVitalAssessmentsResult = {
  items: VitalAssessmentListItem[]
  nextCursor: string | null
}

export async function listVitalAssessments(
  input: ListVitalAssessmentsQuery,
  actor: { userId: string; role: Role },
): Promise<ListVitalAssessmentsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view vital assessments`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const rows = await db.vitalAssessment.findMany({
    where: { patientId: input.patientId },
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ assessedAt: "desc" }, { id: "desc" }],
    include: vitalAssessmentInclude,
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
    detail: { query: { patientId: input.patientId, count: rows.length } },
  })

  return { items: rows.map(toListItem), nextCursor }
}

export async function updateVitalAssessment(
  id: string,
  input: UpdateVitalAssessmentInput,
  actor: { userId: string; role: Role },
): Promise<VitalAssessmentListItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot modify a vital assessment`)
  }

  return db.$transaction(async (tx) => {
    const before = await tx.vitalAssessment.findUnique({ where: { id }, select: { id: true } })
    if (!before) throw new NotFoundError("Vital assessment not found")

    const data: Prisma.VitalAssessmentUpdateInput = {}
    if (input.assessedAt !== undefined) data.assessedAt = input.assessedAt
    if (input.consultant !== undefined) data.consultant = input.consultant
    if (input.note !== undefined) data.note = input.note
    if (input.measurements !== undefined) data.measurements = sanitizeMeasurements(input.measurements)

    const updated = await tx.vitalAssessment.update({
      where: { id },
      data,
      include: vitalAssessmentInclude,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: id,
      detail: { after: { id: updated.id } },
    })

    return toListItem(updated)
  })
}

export async function deleteVitalAssessment(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!DELETE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot delete a vital assessment`)
  }

  await db.$transaction(async (tx) => {
    const before = await tx.vitalAssessment.findUnique({ where: { id }, select: { id: true } })
    if (!before) throw new NotFoundError("Vital assessment not found")

    await tx.vitalAssessment.delete({ where: { id } })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "DELETE",
      entityId: id,
      detail: { before: { id: before.id } },
    })
  })
}
