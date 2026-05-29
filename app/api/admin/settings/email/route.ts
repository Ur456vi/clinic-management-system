/**
 * `/api/admin/settings/email`
 *
 *   GET — current email/SMTP settings (password never returned; only
 *         `hasPassword`).
 *   PUT — upsert the settings. Omit/blank `password` to keep the existing
 *         one. ADMIN only.
 *
 * Credentials are stored in the `settings` table with the password encrypted
 * at rest (lib/crypto). The transactional mailer (lib/email) reads this
 * config and sends via nodemailer/SMTP (Brevo) when enabled.
 */

import { Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { getPublicEmailSettings, saveEmailSettings } from "@/lib/settings"

export const GET = defineHandler(async () => {
  await requireRole(Role.ADMIN)
  return ok(await getPublicEmailSettings())
})

const bodySchema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().max(255),
  // Optional on update — blank means "keep existing password".
  password: z.string().max(512).optional(),
  fromName: z.string().trim().max(120),
  fromEmail: z.string().trim().max(255),
})

export const PUT = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN)
  const body = bodySchema.parse(await req.json())
  return ok(await saveEmailSettings(body))
})
