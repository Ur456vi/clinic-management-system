/**
 * RefillRequest service layer.
 *
 * Owns the business rules for the `RefillRequest` model: role gating,
 * patient / plan-item existence + ownership checks, snapshot backfill,
 * status-transition validation, audit writes, and a best-effort patient
 * notification on each decision. The route handlers under
 * `app/api/refills/**` and the patient self-route are thin wrappers.
 *
 * Two create paths share `buildCreateData`:
 *   - `createRefillRequest`     — staff acting on a patient's behalf.
 *   - `createSelfRefillRequest` — a PATIENT login requesting their own.
 *
 * Mirrors `lib/services/infusion-log.ts` (transition machine + atomic
 * audit) and `lib/services/patient-self.ts` (hard-pinned patient scope).
 */

import type { Prisma } from "@prisma/client"
import { NotificationKind, RefillRequestStatus, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_REFILL_TRANSITIONS,
  type CreateRefillRequestInput,
  type CreateSelfRefillRequestInput,
  type ListRefillRequestsQuery,
  type TransitionRefillRequestInput,
} from "@/lib/validation/refill-request"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create-on-behalf and to decide (approve/fulfil/decline). */
const WRITE_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
]

/** Roles allowed to read the staff-facing refill queue. */
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
// Include shape
// ---------------------------------------------------------------------------

const REFILL_INCLUDE = {
  patient: {
    select: { id: true, patientNumber: true, fullName: true, userId: true },
  },
  planItem: { select: { id: true, name: true, kind: true } },
  requestedBy: {
    select: { id: true, role: true, staff: { select: { fullName: true } } },
  },
  decidedBy: {
    select: { id: true, staff: { select: { fullName: true } } },
  },
} as const

export type RefillRequestWithRelations = Prisma.RefillRequestGetPayload<{
  include: typeof REFILL_INCLUDE
}>

// ---------------------------------------------------------------------------
// Audit helper (atomic when `client` is a tx)
// ---------------------------------------------------------------------------

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
        entityType: "RefillRequest",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    console.error("[refill-request] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Create — shared
// ---------------------------------------------------------------------------

/**
 * Resolve the row data for a new request. Verifies the patient exists and,
 * when `planItemId` is supplied, that the item belongs to that patient;
 * the snapshot (name / dose / frequency) is backfilled from the linked
 * item when the caller left those blank.
 */
async function buildCreateData(
  tx: Prisma.TransactionClient,
  patientId: string,
  input: CreateSelfRefillRequestInput,
  requestedById: string,
): Promise<Prisma.RefillRequestUncheckedCreateInput> {
  const patient = await tx.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  })
  if (!patient) throw new NotFoundError("Patient not found")

  let dose = input.dose
  let frequency = input.frequency
  let itemName = input.itemName

  if (input.planItemId) {
    const item = await tx.treatmentPlanItem.findUnique({
      where: { id: input.planItemId },
      select: { id: true, name: true, dose: true, frequency: true, plan: { select: { patientId: true } } },
    })
    if (!item) throw new NotFoundError("Prescribed item not found")
    if (item.plan.patientId !== patientId) {
      throw new ForbiddenError("Prescribed item does not belong to this patient")
    }
    // Backfill snapshot from the item when the caller didn't override.
    if (!itemName) itemName = item.name
    if (dose === undefined) dose = item.dose ?? undefined
    if (frequency === undefined) frequency = item.frequency ?? undefined
  }

  return {
    patientId,
    planItemId: input.planItemId,
    itemName,
    dose,
    frequency,
    note: input.note,
    requestedById,
    // status defaults to PENDING via the schema.
  }
}

/**
 * Staff create-on-behalf. Role-gated to WRITE_ROLES.
 */
export async function createRefillRequest(
  input: CreateRefillRequestInput,
  actor: { userId: string; role: Role },
): Promise<RefillRequestWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot create a refill request`)
  }

  return db.$transaction(async (tx) => {
    const data = await buildCreateData(
      tx,
      input.patientId,
      input,
      actor.userId,
    )
    const created = await tx.refillRequest.create({
      data,
      include: REFILL_INCLUDE,
    })
    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: { source: "staff", after: { id: created.id, patientId: created.patientId, itemName: created.itemName, status: created.status } },
    })
    return created
  })
}

/**
 * Patient self-service create. The `patientId` comes from
 * `requirePatientSession()` — never from the request body.
 */
export async function createSelfRefillRequest(args: {
  patientId: string
  actorUserId: string
  input: CreateSelfRefillRequestInput
}): Promise<RefillRequestWithRelations> {
  return db.$transaction(async (tx) => {
    const data = await buildCreateData(
      tx,
      args.patientId,
      args.input,
      args.actorUserId,
    )
    const created = await tx.refillRequest.create({
      data,
      include: REFILL_INCLUDE,
    })
    await writeAudit(tx, {
      actorUserId: args.actorUserId,
      action: "CREATE",
      entityId: created.id,
      detail: { source: "self", after: { id: created.id, itemName: created.itemName, status: created.status } },
    })
    return created
  })
}

// ---------------------------------------------------------------------------
// List — staff queue
// ---------------------------------------------------------------------------

export type ListRefillRequestsResult = {
  items: RefillRequestWithRelations[]
  nextCursor: string | null
}

export async function listRefillRequests(
  input: ListRefillRequestsQuery,
  actor: { userId: string; role: Role },
): Promise<ListRefillRequestsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view refill requests`)
  }

  const take = Math.min(
    (input as { limit?: number }).limit ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  )

  const where: Prisma.RefillRequestWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.status) where.status = { in: input.status }

  const rows = await db.refillRequest.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: REFILL_INCLUDE,
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
    detail: { query: { patientId: input.patientId ?? null, status: input.status ?? null, count: rows.length } },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// List — patient self
// ---------------------------------------------------------------------------

export async function listSelfRefillRequests(args: {
  patientId: string
  actorUserId: string
  input: { limit?: number; cursor?: string | null }
}): Promise<ListRefillRequestsResult> {
  const take = Math.min(args.input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const rows = await db.refillRequest.findMany({
    where: { patientId: args.patientId },
    take: take + 1,
    ...(args.input.cursor
      ? { cursor: { id: args.input.cursor }, skip: 1 }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: REFILL_INCLUDE,
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Transition (status machine)
// ---------------------------------------------------------------------------

/**
 * Apply a status transition (staff only).
 *
 *   PENDING  -> APPROVED | DECLINED
 *   APPROVED -> FULFILLED | DECLINED
 *   FULFILLED / DECLINED are terminal.
 *
 * Stamps the matching lifecycle timestamp + `decidedBy`/`decisionNote`, then
 * fires a best-effort in-app notification to the patient's linked login.
 */
export async function transitionRefillRequest(
  id: string,
  input: TransitionRefillRequestInput,
  actor: { userId: string; role: Role },
): Promise<RefillRequestWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot decide refill requests`)
  }

  const after = await db.$transaction(async (tx) => {
    const before = await tx.refillRequest.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Refill request not found")

    if (before.status === input.to) {
      throw new ValidationError(`Refill request is already ${before.status}`)
    }

    const allowed = ALLOWED_REFILL_TRANSITIONS[before.status] ?? []
    if (!allowed.includes(input.to)) {
      throw new ValidationError(
        `Illegal transition: ${before.status} -> ${input.to}`,
      )
    }

    const now = new Date()
    const data: Prisma.RefillRequestUpdateInput = {
      status: input.to,
      decidedBy: { connect: { id: actor.userId } },
      ...(input.note !== undefined ? { decisionNote: input.note } : {}),
    }
    if (input.to === RefillRequestStatus.APPROVED) data.approvedAt = now
    if (input.to === RefillRequestStatus.FULFILLED) data.fulfilledAt = now
    if (input.to === RefillRequestStatus.DECLINED) data.declinedAt = now

    const updated = await tx.refillRequest.update({
      where: { id },
      data,
      include: REFILL_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: updated.id,
      detail: {
        transition: { from: before.status, to: updated.status },
        note: input.note ?? null,
      },
    })

    return updated
  })

  // Best-effort patient notification — outside the tx so a notification
  // hiccup never rolls back the decision.
  if (after.patient.userId) {
    const verb =
      after.status === RefillRequestStatus.APPROVED
        ? "approved"
        : after.status === RefillRequestStatus.FULFILLED
          ? "fulfilled"
          : after.status === RefillRequestStatus.DECLINED
            ? "declined"
            : "updated"
    try {
      await db.notification.create({
        data: {
          userId: after.patient.userId,
          kind: NotificationKind.GENERIC,
          title: `Refill ${verb}: ${after.itemName}`,
          body: after.decisionNote ?? null,
          sourceType: "RefillRequest",
          sourceRefId: after.id,
        },
      })
    } catch (err) {
      console.error("[refill-request] notification write failed", err)
    }
  }

  return after
}
