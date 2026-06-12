/**
 * `GET / PATCH /api/me/notification-preferences`
 *
 * Read and update the calling user's email-notification toggles. Backed by
 * the `User.notificationPrefs` JSONB column; a null column resolves to the
 * all-on defaults.
 *
 *   GET   200 : { data: NotificationPrefs }
 *   PATCH 200 : { data: NotificationPrefs }   (merged result)
 *   401       : not signed in
 *   422       : empty / malformed body
 */

import type { Prisma } from "@prisma/client"

import { defineHandler, ok, requireSession, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import {
  resolveNotificationPrefs,
  updateNotificationPrefsSchema,
} from "@/lib/validation/notification-preferences"

export const GET = defineHandler(async () => {
  const session = await requireSession()
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { notificationPrefs: true },
  })
  if (!user) throw new ValidationError("Account not found")
  return ok(resolveNotificationPrefs(user.notificationPrefs))
})

export const PATCH = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const patch = updateNotificationPrefsSchema.parse(await req.json())

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { notificationPrefs: true },
  })
  if (!user) throw new ValidationError("Account not found")

  // Merge the patch onto the current resolved prefs so partial updates keep
  // untouched channels intact.
  const merged = { ...resolveNotificationPrefs(user.notificationPrefs), ...patch }

  await db.user.update({
    where: { id: session.userId },
    data: { notificationPrefs: merged as unknown as Prisma.InputJsonValue },
  })

  return ok(merged)
})
