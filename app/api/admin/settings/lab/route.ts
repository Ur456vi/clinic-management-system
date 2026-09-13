/**
 * `/api/admin/settings/lab`
 *
 *   GET — current lab partner settings. Secrets are never returned; the client
 *         sees only `hasClientSecret` / `hasWebhookSecret`.
 *   PUT — upsert the settings. Omit/blank a secret to keep the stored one.
 *         ADMIN only.
 *
 * Every field is optional in the sense that blank means "fall back to env" —
 * see lib/services/lab/config.ts for the resolution order. That is what lets an
 * admin clear a field to revert to the deployed value instead of breaking the
 * integration.
 */

import { Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { env } from "@/lib/env"
import { clearTokenCache } from "@/lib/services/lab/client"
import { getPublicLabSettings, saveLabSettings } from "@/lib/services/lab/settings"

export const GET = defineHandler(async () => {
  await requireRole(Role.ADMIN)
  return ok({
    ...(await getPublicLabSettings()),
    /**
     * `LAB_WEBHOOK_ALLOW_UNAUTHENTICATED=false` in the server environment
     * overrides the stored setting and cannot be undone from here. The screen
     * has to say so — otherwise an admin picks "Allow", saves successfully,
     * and inbound webhooks keep being rejected with no explanation.
     */
    unauthenticatedLockedOffByEnv: env.LAB_WEBHOOK_ALLOW_UNAUTHENTICATED === false,
  })
})

const path = z.string().trim().max(255)
/** Tri-state: null means "not set here, fall back to env". */
const flag = z.boolean().nullable()

const bodySchema = z.object({
  enabled: flag,
  baseUrl: z.string().trim().max(512),
  tokenUrl: z.string().trim().max(512),
  clientId: z.string().trim().max(512),
  // Blank means "keep the stored secret" — the client never receives it, so it
  // cannot echo it back.
  clientSecret: z.string().max(1024).optional(),
  slotsPath: path,
  bookHomePath: path,
  bookCenterPath: path,
  cancelHomePath: path,
  rescheduleHomePath: path,
  cancelCenterPath: path,
  rescheduleCenterPath: path,
  productsPath: path,
  partnerSource: z.string().trim().max(120),
  webhookSecret: z.string().max(1024).optional(),
  allowUnauthenticatedWebhooks: flag,
  patientBookingEnabled: flag,
})

export const PUT = defineHandler(async ({ req }) => {
  const session = await requireRole(Role.ADMIN)
  const body = bodySchema.parse(await req.json())
  const actorUserId = (session as { userId?: string }).userId ?? null

  const saved = await saveLabSettings(body, actorUserId)

  // The OAuth token is cached in-process for 90 minutes. Without this, changing
  // the client id or secret would not take effect until that expired.
  clearTokenCache()

  return ok(saved)
})
