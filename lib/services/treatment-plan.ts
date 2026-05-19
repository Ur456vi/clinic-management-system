/**
 * TreatmentPlan service layer (BE-24).
 *
 * Owns the business rules for the `TreatmentPlan` + `TreatmentPlanItem`
 * models: role gates, status-transition validation, item-replace
 * semantics, and audit-log writes. The route handlers in
 * `app/api/treatment-plans/**` are intentionally thin wrappers that
 * parse input and delegate here.
 *
 * Sprint-1 scope:
 *   - createPlan   — POST /api/treatment-plans
 *   - getPlan      — GET  /api/treatment-plans/:id
 *   - listPlans    — GET  /api/treatment-plans?patientId=…
 *   - updatePlan   — PATCH /api/treatment-plans/:id (DRAFT-only)
 *   - signPlan     — POST  /api/treatment-plans/:id/sign
 *
 * Deferred to BE-25: revoke endpoint, immutable revisions on edit-
 * after-sign (the `version` column ships at default 1 and is reserved
 * for that work). Plan -> appointment materialization lives in BE-29;
 * the protocol library that constrains item shape per kind is BE-26.
 *
 * All writes are wrapped in `db.$transaction` so the AuditLog row commits
 * (or rolls back) atomically with the plan mutation — matches the
 * pattern in `lib/services/consultation.ts` and `…/appointment.ts`.
 */

import type { Prisma, TreatmentPlan } from "@prisma/client"
import { NotificationKind, Role, TreatmentPlanStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { emitNotification } from "@/lib/services/notifications"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_PLAN_TRANSITIONS,
  type CreateTreatmentPlanInput,
  type ListTreatmentPlansQuery,
  type PlanItemInput,
  type UpdateTreatmentPlanInput,
} from "@/lib/validation/treatment-plan"
import {
  materializeAppointmentsForPlan,
  type MaterializationResult,
} from "@/lib/services/plan-materialization"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create / mutate / sign a treatment plan. */
const WRITE_ROLES: readonly Role[] = [Role.ADMIN, Role.DOCTOR]

/**
 * Roles allowed to read plans. Wider than write — RECEPTION needs
 * visibility for billing prep; RMO sees plans alongside intake.
 */
const VIEW_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
]

// ---------------------------------------------------------------------------
// Include shape
// ---------------------------------------------------------------------------

/**
 * Standard include — pulls the patient summary, both author/signer
 * stamps, and the items in display order. Mirrors the shape used by
 * sibling services so the FE can render the plan-detail card with one
 * round-trip.
 */
// Note: do NOT use `as const` here — it deep-freezes the orderBy array
// and Prisma's $itemsArgs.orderBy expects a mutable array. `satisfies`
// preserves the precise literal types for GetPayload inference while
// keeping the array assignable to Prisma's mutable input type.
const PLAN_INCLUDE = {
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
  createdBy: {
    select: {
      id: true,
      email: true,
      role: true,
      staff: { select: { fullName: true } },
    },
  },
  signedBy: {
    select: {
      id: true,
      email: true,
      role: true,
      staff: { select: { fullName: true } },
    },
  },
  items: {
    orderBy: [
      { sequence: "asc" },
      { createdAt: "asc" },
    ] as Prisma.TreatmentPlanItemOrderByWithRelationInput[],
  },
} satisfies Prisma.TreatmentPlanInclude

export type TreatmentPlanWithRelations = Prisma.TreatmentPlanGetPayload<{
  include: typeof PLAN_INCLUDE
}>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertWriteRole(actor: { role: Role }) {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot mutate treatment plans`,
    )
  }
}

function assertViewRole(actor: { role: Role }) {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot view treatment plans`,
    )
  }
}

/**
 * Map the Zod-parsed item shape to a Prisma createMany row, defaulting
 * `sequence` from the array index when the caller omitted it. This
 * keeps callers honest: pass `sequence` explicitly when ordering
 * matters, otherwise array order wins.
 */
function toItemCreateRow(
  item: PlanItemInput,
  index: number,
): Prisma.TreatmentPlanItemCreateManyPlanInput {
  return {
    kind: item.kind,
    name: item.name,
    dose: item.dose ?? null,
    frequency: item.frequency ?? null,
    durationDays: item.durationDays ?? null,
    instructions: item.instructions ?? null,
    sequence: item.sequence ?? index,
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a DRAFT plan with optional initial items.
 *
 *   - Verifies the patient exists (otherwise FK error becomes a 404).
 *   - Inserts items via nested `createMany` so we keep one round trip.
 *   - Writes a CREATE audit row in the same transaction.
 */
export async function createPlan(
  input: CreateTreatmentPlanInput,
  actor: { userId: string; role: Role },
): Promise<TreatmentPlanWithRelations> {
  assertWriteRole(actor)

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const created = await tx.treatmentPlan.create({
      data: {
        patientId: input.patientId,
        createdById: actor.userId,
        title: input.title,
        summary: input.summary,
        status: TreatmentPlanStatus.DRAFT,
        version: 1,
        items: {
          createMany: {
            data: input.items.map(toItemCreateRow),
          },
        },
      },
      include: PLAN_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "TreatmentPlan",
        entityId: created.id,
        detail: {
          after: {
            id: created.id,
            patientId: created.patientId,
            title: created.title,
            itemCount: created.items.length,
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

/**
 * Fetch one plan with items + creator/signer/patient summary. Writes a
 * READ audit row (best-effort — audit failures do not block the read).
 */
export async function getPlan(
  id: string,
  actor: { userId: string; role: Role },
): Promise<TreatmentPlanWithRelations> {
  assertViewRole(actor)

  const plan = await db.treatmentPlan.findUnique({
    where: { id },
    include: PLAN_INCLUDE,
  })
  if (!plan) throw new NotFoundError("Treatment plan not found")

  try {
    await db.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "READ",
        entityType: "TreatmentPlan",
        entityId: plan.id,
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[treatment-plan.getPlan] audit write failed", err)
  }

  return plan
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Cursor-paginated list. Filterable by `patientId` + `status`. Newest
 * plans first — matches the patient-timeline reading order.
 */
export async function listPlans(
  query: ListTreatmentPlansQuery,
  actor: { userId: string; role: Role },
): Promise<{ items: TreatmentPlanWithRelations[]; nextCursor: string | null }> {
  assertViewRole(actor)

  const limit = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.TreatmentPlanWhereInput = {
    ...(query.patientId ? { patientId: query.patientId } : {}),
    ...(query.status ? { status: query.status } : {}),
  }

  const rows = await db.treatmentPlan.findMany({
    where,
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: PLAN_INCLUDE,
  })

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return { items, nextCursor }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Apply a partial PATCH to a DRAFT plan.
 *
 *   - SIGNED + REVOKED are immutable from this endpoint — throws 400.
 *   - When `items` is present, the existing items are deleted and the
 *     new list inserted in one transaction (replace semantics). Omit
 *     `items` to leave them untouched.
 *   - `summary === null` clears the field.
 *
 * Records an UPDATE audit row with `{ before, after, patch }` for replay.
 */
export async function updatePlan(
  id: string,
  input: UpdateTreatmentPlanInput,
  actor: { userId: string; role: Role },
): Promise<TreatmentPlanWithRelations> {
  assertWriteRole(actor)

  return db.$transaction(async (tx) => {
    const before = await tx.treatmentPlan.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!before) throw new NotFoundError("Treatment plan not found")

    if (before.status !== TreatmentPlanStatus.DRAFT) {
      throw new ValidationError(
        `Treatment plan is ${before.status} and cannot be modified`,
      )
    }

    const data: Prisma.TreatmentPlanUpdateInput = {}
    if (input.title !== undefined) data.title = input.title
    if (input.summary !== undefined) data.summary = input.summary

    if (input.items !== undefined) {
      // Replace semantics — delete then insert. Cascade is on the FK so
      // we use deleteMany scoped to this plan rather than relying on it.
      await tx.treatmentPlanItem.deleteMany({ where: { planId: id } })
      if (input.items.length > 0) {
        await tx.treatmentPlanItem.createMany({
          data: input.items.map((item, idx) => ({
            planId: id,
            ...toItemCreateRow(item, idx),
          })),
        })
      }
    }

    const after = await tx.treatmentPlan.update({
      where: { id },
      data,
      include: PLAN_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "TreatmentPlan",
        entityId: after.id,
        detail: {
          before: {
            title: before.title,
            summary: before.summary,
            itemCount: before.items.length,
          },
          after: {
            title: after.title,
            summary: after.summary,
            itemCount: after.items.length,
          },
          patch: input as unknown as Prisma.InputJsonValue,
        },
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Sign
// ---------------------------------------------------------------------------

/**
 * Flip a DRAFT plan to SIGNED. Stamps `signedAt` (server clock) and
 * `signedById` (the actor) atomically. `version` stays at 1 in Sprint 1.
 *
 * Side-effect (BE-29): once the row flips to SIGNED, in the same
 * transaction we call `materializeAppointmentsForPlan` to seed the
 * recurring appointment sequence for any in-clinic plan items (IV,
 * REHAB, AESTHETIC). The result counts ride alongside the plan in
 * the return shape so the sign endpoint can surface them to the FE.
 *
 * Idempotency note: re-signing a SIGNED plan throws 400 — clients
 * should treat the SIGNED status as the success signal and refrain from
 * retrying once they've seen it. The materialization step is itself
 * idempotent: if appointments already exist for this plan they will
 * not be duplicated.
 */
export type SignPlanResult = {
  plan: TreatmentPlanWithRelations
  materialization: MaterializationResult
}

export async function signPlan(
  id: string,
  actor: { userId: string; role: Role },
): Promise<SignPlanResult> {
  assertWriteRole(actor)

  return db.$transaction(async (tx) => {
    const before = await tx.treatmentPlan.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Treatment plan not found")

    const allowed = ALLOWED_PLAN_TRANSITIONS[before.status] ?? []
    if (!allowed.includes(TreatmentPlanStatus.SIGNED)) {
      throw new ValidationError(
        `Cannot sign a plan in status ${before.status}`,
      )
    }

    const signedAt = new Date()
    const after = await tx.treatmentPlan.update({
      where: { id },
      data: {
        status: TreatmentPlanStatus.SIGNED,
        signedAt,
        signedById: actor.userId,
      },
      include: PLAN_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "TreatmentPlan",
        entityId: after.id,
        detail: {
          before: { status: before.status },
          after: {
            status: after.status,
            signedAt: after.signedAt,
            signedById: after.signedById,
          },
          op: "SIGN",
        },
      },
    })

    // BE-29: materialize recurring appointments AFTER the status flip,
    // within the same transaction so a failure rolls back the sign.
    const materialization = await materializeAppointmentsForPlan(after.id, {
      tx,
      signedAt,
      signedById: actor.userId,
    })

    // BE-45 fan-out: if the patient has a linked unified-portal User
    // login, drop a PLAN_SIGNED notification into their feed. Runs
    // inside the same transaction so the notification commits with the
    // plan signature (or rolls back together on failure).
    const patient = await tx.patient.findUnique({
      where: { id: after.patientId },
      select: { userId: true },
    })
    if (patient?.userId) {
      await emitNotification({
        userId: patient.userId,
        kind: NotificationKind.PLAN_SIGNED,
        title: "Your treatment plan has been signed",
        body: after.title,
        sourceType: "TreatmentPlan",
        sourceRefId: after.id,
        tx,
      })
    }

    return { plan: after, materialization }
  })
}

// ---------------------------------------------------------------------------
// Revoke (BE-25)
// ---------------------------------------------------------------------------

/**
 * Flip a SIGNED plan to REVOKED. Stamps `revokedAt` / `revokedById` and
 * (optionally) `revokeReason` atomically with the audit row.
 *
 * Authorization beyond the WRITE_ROLES gate:
 *   - ADMIN may revoke any plan.
 *   - DOCTOR may revoke only a plan they themselves signed (or, if
 *     unsigned, drafted — though DRAFT plans always 409 below, this
 *     check is harmless).
 *
 * DRAFT plans cannot be revoked through this endpoint — callers should
 * delete the draft via PATCH-with-empty or the future DELETE path. We
 * return ValidationError → 400 to keep the surface predictable; the
 * route layer maps 409 from the spec onto the same envelope.
 *
 * Re-revoking is a no-op error (already-REVOKED plans throw 400).
 */
export async function revokePlan(
  id: string,
  actor: { userId: string; role: Role },
  reason?: string,
): Promise<TreatmentPlanWithRelations> {
  assertWriteRole(actor)

  return db.$transaction(async (tx) => {
    const before = await tx.treatmentPlan.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Treatment plan not found")

    const allowed = ALLOWED_PLAN_TRANSITIONS[before.status] ?? []
    if (!allowed.includes(TreatmentPlanStatus.REVOKED)) {
      throw new ValidationError(
        `Cannot revoke a plan in status ${before.status}`,
      )
    }

    // DOCTOR-scope check: only the signer (or original drafter when
    // unsigned, which can't reach here today) may revoke. Admin bypasses.
    if (actor.role === Role.DOCTOR) {
      const ownedByActor =
        before.signedById === actor.userId ||
        before.createdById === actor.userId
      if (!ownedByActor) {
        throw new ForbiddenError(
          "Doctors may only revoke plans they signed or authored",
        )
      }
    }

    const revokedAt = new Date()
    const after = await tx.treatmentPlan.update({
      where: { id },
      data: {
        status: TreatmentPlanStatus.REVOKED,
        revokedAt,
        revokedById: actor.userId,
        revokeReason: reason ?? null,
      },
      include: PLAN_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "TreatmentPlan",
        entityId: after.id,
        detail: {
          before: { status: before.status },
          after: {
            status: after.status,
            revokedAt: after.revokedAt,
            revokedById: after.revokedById,
            revokeReason: after.revokeReason,
          },
          op: "REVOKE",
        },
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Version (BE-25)
// ---------------------------------------------------------------------------

/**
 * Clone a plan into a fresh DRAFT — header + items — and increment the
 * version counter. Works from any source status (DRAFT / SIGNED /
 * REVOKED): the use case is editing a signed plan without mutating the
 * immutable record, but the FE also wants the "copy as new draft"
 * affordance off a revoked plan.
 *
 * The new row:
 *   - `status = DRAFT`
 *   - `version = source.version + 1`
 *   - `previousVersionId = source.id`
 *   - `createdById = actor.userId` (the cloning user, not the original
 *     author — keeps audit clean)
 *   - `signedAt`, `signedById`, `revokedAt`, `revokedById`,
 *     `revokeReason` all reset to NULL
 *   - items copied verbatim (preserving `sequence`); new item ids
 *
 * Records a CREATE audit row on the new plan with `op: "VERSION"` and
 * the source id in `detail.before.previousVersionId` for replay.
 */
export async function versionPlan(
  id: string,
  actor: { userId: string; role: Role },
): Promise<TreatmentPlanWithRelations> {
  assertWriteRole(actor)

  return db.$transaction(async (tx) => {
    const source = await tx.treatmentPlan.findUnique({
      where: { id },
      include: { items: { orderBy: [{ sequence: "asc" }, { createdAt: "asc" }] } },
    })
    if (!source) throw new NotFoundError("Treatment plan not found")

    const created = await tx.treatmentPlan.create({
      data: {
        patientId: source.patientId,
        createdById: actor.userId,
        title: source.title,
        summary: source.summary,
        status: TreatmentPlanStatus.DRAFT,
        version: source.version + 1,
        previousVersionId: source.id,
        items: {
          createMany: {
            data: source.items.map((item, idx) => ({
              kind: item.kind,
              name: item.name,
              dose: item.dose,
              frequency: item.frequency,
              durationDays: item.durationDays,
              instructions: item.instructions,
              sequence: item.sequence ?? idx,
            })),
          },
        },
      },
      include: PLAN_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "TreatmentPlan",
        entityId: created.id,
        detail: {
          before: {
            previousVersionId: source.id,
            previousVersion: source.version,
            previousStatus: source.status,
          },
          after: {
            id: created.id,
            version: created.version,
            itemCount: created.items.length,
          },
          op: "VERSION",
        },
      },
    })

    return created
  })
}

// ---------------------------------------------------------------------------
// Re-exports for callers that don't want to reach into Prisma directly.
// ---------------------------------------------------------------------------

export type { TreatmentPlan }
