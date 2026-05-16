/**
 * Audit-log helper (BE-23).
 *
 * Single entry point for writing rows into the `AuditLog` table from
 * application code. Two reasons to centralise it:
 *
 *   1. **Fail-soft semantics.** Audit writes must never break the
 *      originating request — a transient DB hiccup on the audit insert
 *      should not prevent a patient READ from returning 200, or roll
 *      back an otherwise successful PATCH. Callers that want
 *      transactional audit writes can pass `tx` (see below); callers
 *      that don't want a hard dependency on audit availability can let
 *      this helper swallow + log.
 *
 *   2. **No-op skip.** When both `actorUserId` and `entityId` are null
 *      AND `action` is not LOGIN/LOGOUT, the row carries no useful
 *      information and is dropped. This keeps the table free of
 *      "anonymous touched nothing" noise.
 *
 * Usage — best-effort (post-read audit, fire-and-forget):
 *
 *   await recordAudit({
 *     actorUserId: session.userId,
 *     action: "READ",
 *     entityType: "Patient",
 *     entityId: patient.id,
 *   })
 *
 * Usage — transactional (write that must roll back with the mutation):
 *
 *   await db.$transaction(async (tx) => {
 *     const after = await tx.patient.update(...)
 *     await recordAudit({
 *       actorUserId,
 *       action: "UPDATE",
 *       entityType: "Patient",
 *       entityId: after.id,
 *       detail: { before, after },
 *     }, { tx })
 *   })
 *
 * When `tx` is supplied the helper uses it directly and lets errors
 * propagate (so the surrounding transaction can roll back). When `tx`
 * is omitted the helper opens its own write against `db` and swallows
 * any error after console-logging it.
 */

import type { Prisma } from "@prisma/client"
import { AuditAction } from "@prisma/client"

import { db } from "@/lib/db"

export type RecordAuditInput = {
  /** UUID of the User performing the action. `null` for system events. */
  actorUserId?: string | null
  /** Discrete audit verb. See the `AuditAction` enum. */
  action: AuditAction
  /** Logical entity name, e.g. `"Patient"`, `"Consultation"`, `"Staff"`. */
  entityType: string
  /** Primary key of the affected row. Stringified so uuid + bigint fit. */
  entityId?: string | null
  /** Optional structured payload (before/after diff, request meta, ...). */
  detail?: Prisma.InputJsonValue
}

export type RecordAuditOptions = {
  /**
   * Prisma transaction client. When provided, the audit row is written
   * inside the surrounding `$transaction` and errors **propagate** so
   * the caller can roll back. When omitted, the helper writes against
   * the global `db` and swallows any error (best-effort).
   */
  tx?: Prisma.TransactionClient
}

/**
 * Sampling memo for `recordAuditSampled`. Keyed by
 * `${action}|${entityType}|${entityId}|${actorUserId}` so two different
 * authors editing the same consultation each get their own 60-second
 * window.
 *
 * In-memory by design - sampling is a best-effort dedup, not a
 * correctness guarantee. A pod restart resets the windows and the next
 * autosave will write a fresh row. The map is cleaned lazily on every
 * call so we don't accumulate dead keys.
 */
const SAMPLING_WINDOW_MS = 60_000
const sampledLastWriteAt = new Map<string, number>()

function pruneSamplingCache(now: number): void {
  // Inexpensive linear sweep; the map will rarely exceed a few dozen
  // entries in a single-process dev/demo deployment. If this ever
  // becomes a hot path the natural next step is moving the window
  // bookkeeping to Redis.
  for (const [key, ts] of sampledLastWriteAt.entries()) {
    if (now - ts > SAMPLING_WINDOW_MS) sampledLastWriteAt.delete(key)
  }
}

/**
 * Should this audit row be written *now*, given the per-window sampler?
 * Returns `true` and stamps the window when the call is the first in
 * its 60-second slot; returns `false` to indicate the caller should
 * skip the write.
 *
 * Exported so callers can short-circuit *before* doing the diff work.
 */
export function shouldRecordSampledAudit(input: {
  action: AuditAction
  entityType: string
  entityId?: string | null
  actorUserId?: string | null
}): boolean {
  if (!input.entityId) return true
  const now = Date.now()
  pruneSamplingCache(now)
  const key = `${input.action}|${input.entityType}|${input.entityId}|${input.actorUserId ?? "anon"}`
  const last = sampledLastWriteAt.get(key)
  if (last !== undefined && now - last < SAMPLING_WINDOW_MS) return false
  sampledLastWriteAt.set(key, now)
  return true
}

const LOGIN_LOGOUT: ReadonlySet<AuditAction> = new Set([
  AuditAction.LOGIN,
  AuditAction.LOGOUT,
])

/**
 * Write an audit row.
 *
 * - Skips entirely (returns without erroring) when both `actorUserId`
 *   and `entityId` are null AND the action is not LOGIN/LOGOUT.
 * - When `opts.tx` is provided, writes inside the transaction and lets
 *   errors propagate.
 * - When `opts.tx` is omitted, writes against `db` and swallows any
 *   error after logging it via `console.error`.
 */
export async function recordAudit(
  input: RecordAuditInput,
  opts: RecordAuditOptions = {},
): Promise<void> {
  const hasActor = input.actorUserId !== null && input.actorUserId !== undefined
  const hasEntity = input.entityId !== null && input.entityId !== undefined
  if (!hasActor && !hasEntity && !LOGIN_LOGOUT.has(input.action)) {
    return
  }

  const data: Prisma.AuditLogUncheckedCreateInput = {
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    ...(input.detail !== undefined ? { detail: input.detail } : {}),
  }

  if (opts.tx) {
    // Transactional path: caller wants the audit row to commit or roll
    // back with the surrounding mutation. We let errors propagate.
    await opts.tx.auditLog.create({ data })
    return
  }

  try {
    await db.auditLog.create({ data })
  } catch (err) {
    // Fail-soft: never break the originating request because audit
    // write failed. Log loudly so the issue is visible in prod logs.
    // eslint-disable-next-line no-console
    console.error("[recordAudit] audit write failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      err,
    })
  }
}

/**
 * Sampled variant for high-frequency mutation paths (consultation
 * autosave is the canonical caller). Writes at most one row per
 * 60-second window per `(action, entityType, entityId, actorUserId)`
 * tuple.
 *
 * Returns the same `Promise<void>` as `recordAudit` so the call site
 * can `await` it uniformly. When the window says "skip", the promise
 * resolves immediately without touching the DB.
 */
export async function recordAuditSampled(
  input: RecordAuditInput,
  opts: RecordAuditOptions = {},
): Promise<void> {
  if (
    !shouldRecordSampledAudit({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorUserId: input.actorUserId,
    })
  ) {
    return
  }
  return recordAudit(input, opts)
}
