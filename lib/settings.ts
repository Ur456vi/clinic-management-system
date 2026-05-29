/**
 * Settings service — typed access to the `settings` key-value table.
 *
 * The "email" key stores the transactional-mailer SMTP config (Brevo SMTP by
 * default). The password is encrypted at rest via lib/crypto and is never
 * returned to the client — the API surfaces only `hasPassword`.
 */

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/crypto"

const EMAIL_KEY = "email"

/** Stored shape (password held encrypted as `passwordEnc`). */
export interface StoredEmailSettings {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  passwordEnc: string
  fromName: string
  fromEmail: string
}

/** What the admin form sends. `password` is optional on update. */
export interface EmailSettingsInput {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  password?: string
  fromName: string
  fromEmail: string
}

/** Safe shape returned to the client (no secret). */
export interface PublicEmailSettings {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  hasPassword: boolean
  fromName: string
  fromEmail: string
}

/** Runtime config the mailer needs (password decrypted). */
export interface EmailConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromName: string
  fromEmail: string
}

const DEFAULTS: StoredEmailSettings = {
  enabled: false,
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  user: "",
  passwordEnc: "",
  fromName: "Dr. Yuvraaj Singh M.D.",
  fromEmail: "",
}

async function readRaw(): Promise<StoredEmailSettings> {
  const row = await db.setting.findUnique({ where: { key: EMAIL_KEY } })
  if (!row) return { ...DEFAULTS }
  return { ...DEFAULTS, ...(row.value as Partial<StoredEmailSettings>) }
}

export async function getPublicEmailSettings(): Promise<PublicEmailSettings> {
  const s = await readRaw()
  return {
    enabled: s.enabled,
    host: s.host,
    port: s.port,
    secure: s.secure,
    user: s.user,
    hasPassword: Boolean(s.passwordEnc),
    fromName: s.fromName,
    fromEmail: s.fromEmail,
  }
}

/** Decrypted config for the mailer. Returns null if no usable config. */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  const s = await readRaw()
  if (!s.enabled || !s.host || !s.user || !s.passwordEnc) return null
  return {
    enabled: s.enabled,
    host: s.host,
    port: s.port,
    secure: s.secure,
    user: s.user,
    password: decryptSecret(s.passwordEnc),
    fromName: s.fromName,
    fromEmail: s.fromEmail,
  }
}

/**
 * Upsert the email settings. If `password` is omitted/blank the existing
 * encrypted password is preserved (so the admin doesn't have to re-enter it
 * on every save).
 */
export async function saveEmailSettings(
  input: EmailSettingsInput,
): Promise<PublicEmailSettings> {
  const current = await readRaw()
  const passwordEnc =
    input.password && input.password.length > 0
      ? encryptSecret(input.password)
      : current.passwordEnc

  const value: StoredEmailSettings = {
    enabled: input.enabled,
    host: input.host.trim(),
    port: input.port,
    secure: input.secure,
    user: input.user.trim(),
    passwordEnc,
    fromName: input.fromName.trim(),
    fromEmail: input.fromEmail.trim(),
  }

  const json = value as unknown as Prisma.InputJsonObject
  await db.setting.upsert({
    where: { key: EMAIL_KEY },
    create: { key: EMAIL_KEY, value: json },
    update: { value: json },
  })

  return getPublicEmailSettings()
}
