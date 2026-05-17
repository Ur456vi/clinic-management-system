/**
 * Notifications service (BE-45).
 *
 * One source of truth for in-app notifications. Every domain event that
 * needs to surface in a user's feed (RMO -> Doctor handoff, plan signed,
 * invoice paid, ...) calls `emitNotification` — usually from inside the
 * originating transaction, so the notification commits (or rolls back)
 * atomically with the event that produced it.
 *
 * History note: this module started as a BE-15 console+audit shim
 * (`notifyDoctorHandoff`). BE-45 replaces the persistence layer with a
 * dedicated `Notification` table but keeps the legacy export as a thin
 * wrapper so the consultation-transition call site doesn't need to be
 * touched twice in one sprint.
 *
 * Surface:
 *   - emitNotification(input)               — create one row, idempotent
 *                                             on (userId, kind, sourceType,
 *                                             sourceRefId) when all four
 *                                             are provided.
 *   - markRead(notificationId, userId)      — flip readAt = now(); throws
 *                                             ForbiddenError if the row
 *                                             belongs to a different user.
 *   - markAllRead(userId)                   — bulk update; returns the
 *                                             number of rows affected.
 *   - listForUser(userId, opts)             — keyset-paginated descending
 *                                             by createdAt; optional
 *                                             `unreadOnly` filter.
 *   - notifyDoctorHandoff(payload)          — legacy BE-15 entry point;
 *                                             writes a HANDOFF row.
 */

import type { Notification, Prisma } from "@prisma/client"
import { NotificationKind } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A Prisma transaction client OR the top-level `db` handle. */
type DbClient = Prisma.TransactionClient | typeof db

export type EmitNotificationInput = {
  /** Recipient User id. */
  userId: string
  kind: NotificationKind
  title: string
  body?: string | null
  /**
   * Polymorphic source pointer. When BOTH `sourceType` and `sourceRefId`
   * are provided alongside `userId` + `kind`, `emitNotification` skips
   * insert if a matching row already exists (idempotency).
   */
  sourceType?: string | null
  sourceRefId?: string | null
  /**
   * Optional Prisma transaction client. Pass this when the caller wants
   * the notification insert to live inside an outer `$transaction` so it
   * commits (or rolls back) atomically with the originating mutation.
   */
  tx?: Prisma.TransactionClient
}

export type ListForUserOpts = {
  /** When true, only rows with `readAt IS NULL` are returned. */
  unreadOnly?: boolean
  /** Page size, clamped to [1, 100]. Defaults to 20. */
  limit?: number
  /** Keyset cursor — the `id` of the last row from the previous page. */
  cursor?: string | null
}

export type ListForUserResult = {
  items: Notification[]
  nextCursor: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function clampLimit(raw: number | undefined): number {
  if (raw === undefined || !Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_LIMIT
  }
  return Math.min(Math.floor(raw), MAX_LIMIT)
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/**
 * Create a notification row. Single source of truth for the fan-out side
 * of the system — every emitter (consultation transition, plan sign,
 * payment captured, ...) routes through here.
 *
 * Idempotency: when `sourceType` AND `sourceRefId` are both set, the
 * service first looks for an existing row with the same
 * `(userId, kind, sourceType, sourceRefId)` tuple. If one is found the
 * existing row is returned and no new row is inserted. This makes the
 * function safe to call from retry-prone code paths (webhook handlers,
 * idempotent transitions, etc.).
 *
 * The function never throws on its own audit-log writes — notification
 * failures must not roll back upstream business mutations. (When called
 * with `tx`, however, a Prisma error WILL bubble up and abort the outer
 * transaction; that is the contract the caller opted into by passing
 * `tx`.)
 */
export async function emitNotification(
  input: EmitNotificationInput,
): Promise<Notification> {
  const client: DbClient = input.tx ?? db

  const sourceType = input.sourceType ?? null
  const sourceRefId = input.sourceRefId ?? null

  // Idempotency check — only when both source fields are provided. We
  // intentionally do NOT enforce this at the DB level: GENERIC
  // notifications and emitters that omit the source pair must remain
  // additive (a clinic could ring the same "you have a new message" bell
  // ten times in a day).
  if (sourceType !== null && sourceRefId !== null) {
    const existing = await client.notification.findFirst({
      where: {
        userId: input.userId,
        kind: input.kind,
        sourceType,
        sourceRefId,
      },
    })
    if (existing) return existing
  }

  return client.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      sourceType,
      sourceRefId,
    },
  })
}

// ---------------------------------------------------------------------------
// Mark read
// ---------------------------------------------------------------------------

/**
 * Flip a single notification to read. Verifies the row is owned by
 * `userId` first — a mismatched owner throws `ForbiddenError` (403), a
 * missing row throws `NotFoundError` (404).
 *
 * Re-reading an already-read row is a no-op: `readAt` is left at its
 * existing timestamp.
 */
export async function markRead(
  notificationId: string,
  userId: string,
): Promise<Notification> {
  const existing = await db.notification.findUnique({
    where: { id: notificationId },
  })
  if (!existing) throw new NotFoundError("Notification not found")
  if (existing.userId !== userId) {
    throw new ForbiddenError("Cannot mark another user's notification read")
  }
  if (existing.readAt) return existing

  return db.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
}

/**
 * Bulk-mark every notification for `userId` as read. Returns the number
 * of rows updated (already-read rows are excluded by the `readAt: null`
 * filter, so the count equals the unread-before-call count).
 */
export async function markAllRead(userId: string): Promise<number> {
  const result = await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
  return result.count
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Paginated descending feed for one user. Keyset pagination by `id` —
 * pass the last row's id back as `cursor` to get the next page.
 *
 * `unreadOnly: true` filters to `readAt IS NULL`. The compound index
 * `(user_id, read_at, created_at DESC)` covers both the filtered and
 * unfiltered access patterns.
 */
export async function listForUser(
  userId: string,
  opts: ListForUserOpts = {},
): Promise<ListForUserResult> {
  const limit = clampLimit(opts.limit)
  const cursor = opts.cursor && opts.cursor.length > 0 ? opts.cursor : null

  const rows = await db.notification.findMany({
    where: {
      userId,
      ...(opts.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  let nextCursor: string | null = null
  if (rows.length > limit) {
    const trimmed = rows.slice(0, limit)
    nextCursor = trimmed[trimmed.length - 1]?.id ?? null
    return { items: trimmed, nextCursor }
  }
  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Legacy BE-15 entry point
// ---------------------------------------------------------------------------

/**
 * Payload for the "RMO finished, doctor please pick up" handoff event.
 * Emitted by `consultation.transition` when a consultation moves
 * `DRAFT -> RMO_DONE`. Kept as a thin wrapper so the BE-15 call site
 * doesn't need to change shape in the same sprint that BE-45 lands.
 */
export type DoctorHandoffPayload = {
  consultationId: string
  patientId: string
  /** User id of the RMO who completed the intake. */
  fromUserId: string
  /**
   * Optional override of the recipient. When omitted, this writes a
   * single HANDOFF row addressed to the RMO themselves — Sprint 1 does
   * not yet pick the on-shift doctor, that's deferred to BE-46. The row
   * still exists in the feed so the demo can show it.
   */
  toUserId?: string
}

/**
 * Wraps `emitNotification` to keep the BE-15 call site stable. Wrapped
 * in try/catch so a notification failure never blocks the originating
 * state transition (the call site is post-commit, outside the
 * transaction — see `lib/services/consultation.ts`).
 */
export async function notifyDoctorHandoff(
  payload: DoctorHandoffPayload,
): Promise<void> {
  const recipient = payload.toUserId ?? payload.fromUserId
  try {
    await emitNotification({
      userId: recipient,
      kind: NotificationKind.HANDOFF,
      title: "RMO consultation ready for doctor review",
      body: `Patient ${payload.patientId} — intake complete, awaiting doctor pickup.`,
      sourceType: "Consultation",
      sourceRefId: payload.consultationId,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notifications.notifyDoctorHandoff] emit failed", err)
  }
}
