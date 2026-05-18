/**
 * `/api/notifications/:id/read` — mark a single notification read (BE-45).
 *
 * POST flips `readAt` to the server clock. Ownership is enforced in the
 * service layer — calling this route with a notification id that
 * belongs to a different user returns 403.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { notificationIdParamSchema } from "@/lib/validation/notification"
import { markRead } from "@/lib/services/notifications"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = notificationIdParamSchema.parse(await params)
  const notification = await markRead(id, session.userId)
  return ok(notification)
})
