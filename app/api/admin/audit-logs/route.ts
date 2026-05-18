/**
 * `GET /api/admin/audit-logs` (BE-23).
 *
 * Admin-only viewer for the append-only `AuditLog` table. Supports
 * keyset pagination over `(occurredAt desc, id desc)` and a handful of
 * server-side filters: `entityType`, `entityId`, `actorUserId`,
 * `action`, `from`, `to`.
 *
 * Response shape:
 *
 *   { "data": [ ... ], "nextCursor": "<id>" | null }
 *
 * The `id` column is a Postgres BigInt — we serialise it to a string
 * so JSON round-trips losslessly (and so cursors are stable). Other
 * date-typed fields are returned as ISO 8601.
 *
 * Auth: ADMIN only — matches `POST /api/staff`'s gate pattern. We
 * intentionally do NOT write a READ audit row when ADMINs view the
 * audit log itself: doing so would create a noise cascade (each
 * inspection adds rows to the table being inspected).
 */

import { NextResponse } from "next/server"

import {
  defineHandler,
  ForbiddenError,
  requireSession,
} from "@/lib/api"
import { Role } from "@prisma/client"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { listAuditLogsQuerySchema } from "@/lib/validation/audit-log"

/** Serialised wire shape — `id` and `entityId` are strings, dates are ISO. */
type AuditLogDTO = {
  id: string
  occurredAt: string
  actorUserId: string | null
  action: string
  entityType: string
  entityId: string | null
  detail: Prisma.JsonValue | null
}

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()
  if (session.role !== Role.ADMIN) {
    throw new ForbiddenError("Only ADMIN may view audit logs")
  }

  const sp = req.nextUrl.searchParams
  const query = listAuditLogsQuerySchema.parse({
    entityType: sp.get("entityType") ?? undefined,
    entityId: sp.get("entityId") ?? undefined,
    actorUserId: sp.get("actorUserId") ?? undefined,
    action: sp.get("action") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const take = query.limit ?? 100

  const where: Prisma.AuditLogWhereInput = {}
  if (query.entityType) where.entityType = query.entityType
  if (query.entityId) where.entityId = query.entityId
  if (query.actorUserId) where.actorUserId = query.actorUserId
  if (query.action) where.action = query.action
  if (query.from || query.to) {
    where.occurredAt = {}
    if (query.from)
      (where.occurredAt as Prisma.DateTimeFilter).gte = query.from
    if (query.to) (where.occurredAt as Prisma.DateTimeFilter).lt = query.to
  }

  // Cursor: row id (BigInt as string). We page on `(occurredAt desc, id
  // desc)`; the BigInt PK is monotonic so it's a sufficient tie-break
  // and a self-describing cursor. Build the findMany args object
  // explicitly typed so TS doesn't widen the `cursor` / `skip` union
  // into something Prisma rejects.
  const findArgs: Prisma.AuditLogFindManyArgs = {
    where,
    take: take + 1,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
  }
  if (query.cursor) {
    findArgs.cursor = { id: BigInt(query.cursor) }
    findArgs.skip = 1
  }

  const rows = await db.auditLog.findMany(findArgs)

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next ? next.id.toString() : null
  }

  const data: AuditLogDTO[] = rows.map((r) => ({
    id: r.id.toString(),
    occurredAt: r.occurredAt.toISOString(),
    actorUserId: r.actorUserId,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    detail: (r.detail ?? null) as Prisma.JsonValue | null,
  }))

  return NextResponse.json({ data, nextCursor })
})
