/**
 * `/api/notifications/read-all` — mark every notification read (BE-45).
 *
 * POST flips `readAt` on every unread notification owned by the calling
 * user. The response carries the count of rows updated so the client can
 * optimistically zero out its unread badge.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { markAllRead } from "@/lib/services/notifications"

export const POST = defineHandler(async () => {
  const session = await requireSession()
  const updated = await markAllRead(session.userId)
  return ok({ updated })
})
