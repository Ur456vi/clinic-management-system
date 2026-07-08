/**
 * Infusion service layer (patient-chart Infusion tab).
 *
 * An infusion session is the lightweight per-session record the clinic captures
 * from the patient chart: a name, the calendar day, free-text start/end clock
 * labels, an eventful/uneventful flag, and an optional note. Distinct from the
 * BE-26 `InfusionLog` protocol log (`lib/services/infusion-log.ts`).
 *
 * Service functions:
 *   - `createInfusion` — POST   /api/infusions
 *   - `listInfusions`  — GET    /api/infusions?patientId=…
 *   - `updateInfusion` — PATCH  /api/infusions/:id
 *   - `deleteInfusion` — DELETE /api/infusions/:id
 *
 * Each read/write writes a best-effort AuditLog row (entityType="Infusion"),
 * consistent with the ClinicalSummary service. Role gates reuse the existing
 * `infusion:*` RBAC actions.
 */

import type { Prisma } from "@prisma/client"
import { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { rolesFor } from "@/lib/rbac"
import type {
  CreateInfusionInput,
  ListInfusionsQuery,
  UpdateInfusionInput,
} from "@/lib/validation/infusion"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create / modify an infusion session. */
const WRITE_ROLES: readonly Role[] = rolesFor("infusion:write")
/** Roles allowed to read infusion sessions. */
const READ_ROLES: readonly Role[] = rolesFor("infusion:read")
/** Roles allowed to delete an infusion session. */
const DELETE_ROLES: readonly Role[] = rolesFor("infusion:delete")

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Best-effort audit write. Failures are logged and swallowed — a broken audit
 * row must not break the underlying read/write (audit is observability, not
 * correctness), matching the ClinicalSummary service.
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
        entityType: "Infusion",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    console.error("[infusion] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type InfusionListItem = {
  id: string
  name: string
  date: string
  startTime: string | null
  endTime: string | null
  eventful: boolean
  note: string | null
  createdByName: string | null
  createdAt: string
}

const infusionInclude = {
  createdBy: { select: { staff: { select: { fullName: true } }, email: true } },
} satisfies Prisma.InfusionInclude

type InfusionRow = Prisma.InfusionGetPayload<{ include: typeof infusionInclude }>

function toListItem(r: InfusionRow): InfusionListItem {
  return {
    id: r.id,
    name: r.name,
    date: r.date.toISOString(),
    startTime: r.startTime,
    endTime: r.endTime,
    eventful: r.eventful,
    note: r.note,
    createdByName: r.createdBy?.staff?.fullName ?? r.createdBy?.email ?? null,
    createdAt: r.createdAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create an infusion session for a patient. WRITE_ROLES gate; verifies the
 * patient exists.
 */
export async function createInfusion(
  input: CreateInfusionInput,
  actor: { userId: string; role: Role },
): Promise<InfusionListItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot create an infusion`)
  }

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const created = await tx.infusion.create({
      data: {
        patientId: input.patientId,
        name: input.name,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        eventful: input.eventful ?? false,
        note: input.note ?? null,
        createdById: actor.userId,
      },
      include: infusionInclude,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: { after: { id: created.id, patientId: created.patientId, name: created.name } },
    })

    return toListItem(created)
  })
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListInfusionsResult = {
  items: InfusionListItem[]
  nextCursor: string | null
}

/**
 * List a patient's infusion sessions, newest first (`date desc, id desc`).
 * READ_ROLES gate. Writes a single READ audit row for the query.
 */
export async function listInfusions(
  input: ListInfusionsQuery,
  actor: { userId: string; role: Role },
): Promise<ListInfusionsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view infusions`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const rows = await db.infusion.findMany({
    where: { patientId: input.patientId },
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: infusionInclude,
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

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Partial update of an infusion session. WRITE_ROLES gate. `null` clears a
 * nullable field; `undefined` leaves it alone.
 */
export async function updateInfusion(
  id: string,
  input: UpdateInfusionInput,
  actor: { userId: string; role: Role },
): Promise<InfusionListItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot modify an infusion`)
  }

  return db.$transaction(async (tx) => {
    const before = await tx.infusion.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!before) throw new NotFoundError("Infusion not found")

    const data: Prisma.InfusionUpdateInput = {}
    if (input.name !== undefined) data.name = input.name
    if (input.date !== undefined) data.date = input.date
    if (input.startTime !== undefined) data.startTime = input.startTime
    if (input.endTime !== undefined) data.endTime = input.endTime
    if (input.eventful !== undefined) data.eventful = input.eventful
    if (input.note !== undefined) data.note = input.note

    const updated = await tx.infusion.update({
      where: { id },
      data,
      include: infusionInclude,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: id,
      detail: { after: { id: updated.id, name: updated.name } },
    })

    return toListItem(updated)
  })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Delete an infusion session. DELETE_ROLES gate (ADMIN only). */
export async function deleteInfusion(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!DELETE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot delete an infusion`)
  }

  await db.$transaction(async (tx) => {
    const before = await tx.infusion.findUnique({
      where: { id },
      select: { id: true, name: true },
    })
    if (!before) throw new NotFoundError("Infusion not found")

    await tx.infusion.delete({ where: { id } })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "DELETE",
      entityId: id,
      detail: { before: { id: before.id, name: before.name } },
    })
  })
}
