/**
 * `/api/notifications` — list the current user's in-app notifications (BE-45).
 *
 *   GET  — paginated descending by `createdAt`. `?unread=true` filters
 *          to unread rows; `?limit=N` clamps to [1, 100]; `?cursor=<id>`
 *          continues from a previous page.
 *
 * Notifications are created via `lib/services/notifications.ts`
 * `emitNotification` from event sites (consultation transition, plan
 * sign, payment captured, ...). There is no POST collection route — the
 * feed is read-only from the API's perspective.
 */

import { NextResponse } from "next/server"

import { defineHandler, requireSession } from "@/lib/api"
import { listNotificationsQuerySchema } from "@/lib/validation/notification"
import { listForUser } from "@/lib/services/notifications"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listNotificationsQuerySchema.parse({
    unread: sp.get("unread") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listForUser(session.userId, {
    unreadOnly: query.unread,
    limit: query.limit,
    cursor: query.cursor ?? null,
  })

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})
