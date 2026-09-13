/**
 * Admin-editable lab (Mahajan Imaging) configuration, stored in the `settings`
 * table under the "lab" key.
 *
 * WHY: every one of these values used to be an env var, so changing an endpoint
 * path the partner renamed, or the panel name they registered us under, meant
 * editing `.env` on the box and restarting. During this integration alone we
 * have had to change the products path, the partner source and the webhook auth
 * flag — each time as a deploy.
 *
 * PRECEDENCE is `db ?? env ?? built-in default`, resolved per field in
 * ./config.ts. A blank string or a null boolean here means "not set — fall back
 * to env", so a deployment with no settings row behaves exactly as it did
 * before this table existed. That is what makes the migration safe to ship.
 *
 * Secrets (`clientSecretEnc`, `webhookSecretEnc`) are encrypted at rest with
 * lib/crypto, the same helper the stored SMTP password uses. They are never
 * returned to the client — the API exposes only `hasClientSecret` /
 * `hasWebhookSecret`, and a blank value on save means "keep the existing one".
 */

import { decryptSecret, encryptSecret } from "@/lib/crypto"
import { logger } from "@/lib/logger"
import { readSetting, writeSetting } from "@/lib/settings"
import { recordAudit } from "@/lib/services/audit"

const log = logger.child({ mod: "lab-settings" })

export const LAB_SETTINGS_KEY = "lab"

/**
 * Read-through cache. `getLabConfig()` is called twice per outbound partner
 * call (once in `fetchToken`, once in `buildUrl`), so an uncached read would
 * double the DB round-trips on every request to Mahajan.
 *
 * The TTL is also how a change reaches OTHER instances behind the load
 * balancer — the saving instance clears its own cache immediately, the rest
 * pick it up within the window. Keep it short.
 */
const CACHE_TTL_MS = 30_000
/**
 * Failures are cached too, briefly. Without this, a database that is down makes
 * every resolution pay the full connection timeout — and `getLabConfig()` runs
 * twice per outbound partner call, so an outage would turn each one into a
 * multi-second stall rather than a fast fall back to env.
 */
const FAILURE_TTL_MS = 5_000
let cache: { value: StoredLabSettings; expiresAt: number } | null = null

/**
 * Stored shape. Empty string / null both mean "not configured here, fall back
 * to env" — they are not the same as a deliberate empty value.
 */
export interface StoredLabSettings {
  enabled: boolean | null
  baseUrl: string
  tokenUrl: string
  clientId: string
  clientSecretEnc: string
  slotsPath: string
  bookHomePath: string
  bookCenterPath: string
  cancelHomePath: string
  rescheduleHomePath: string
  cancelCenterPath: string
  rescheduleCenterPath: string
  productsPath: string
  partnerSource: string
  webhookSecretEnc: string
  allowUnauthenticatedWebhooks: boolean | null
  patientBookingEnabled: boolean | null
}

/** What the admin form sends. Secrets optional — blank means keep existing. */
export interface LabSettingsInput extends Omit<
  StoredLabSettings,
  "clientSecretEnc" | "webhookSecretEnc"
> {
  clientSecret?: string
  webhookSecret?: string
}

/** Safe shape for the client — no secrets, just whether they are set. */
export interface PublicLabSettings extends Omit<
  StoredLabSettings,
  "clientSecretEnc" | "webhookSecretEnc"
> {
  hasClientSecret: boolean
  hasWebhookSecret: boolean
}

const DEFAULTS: StoredLabSettings = {
  enabled: null,
  baseUrl: "",
  tokenUrl: "",
  clientId: "",
  clientSecretEnc: "",
  slotsPath: "",
  bookHomePath: "",
  bookCenterPath: "",
  cancelHomePath: "",
  rescheduleHomePath: "",
  cancelCenterPath: "",
  rescheduleCenterPath: "",
  productsPath: "",
  partnerSource: "",
  webhookSecretEnc: "",
  allowUnauthenticatedWebhooks: null,
  patientBookingEnabled: null,
}

/** Drop the cache. Called on save; exported as a test/manual hook. */
export function clearLabSettingsCache(): void {
  cache = null
}

/**
 * Stored settings, cached. Never throws on a DB failure — it logs and falls
 * back to DEFAULTS, which resolves to pure-env behaviour. A settings table
 * that is briefly unreachable must not take the whole lab integration down.
 */
export async function getLabSettings(): Promise<StoredLabSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value
  try {
    const value = await readSetting(LAB_SETTINGS_KEY, DEFAULTS)
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS }
    return value
  } catch (err) {
    log.error(
      { err: err instanceof Error ? err.message : String(err) },
      "lab settings read failed — falling back to env",
    )
    const value = { ...DEFAULTS }
    cache = { value, expiresAt: Date.now() + FAILURE_TTL_MS }
    return value
  }
}

/** Decrypted secrets for the config resolver. Server-side only. */
export async function getLabSecrets(): Promise<{ clientSecret: string; webhookSecret: string }> {
  const s = await getLabSettings()
  return {
    clientSecret: decryptSecret(s.clientSecretEnc),
    webhookSecret: decryptSecret(s.webhookSecretEnc),
  }
}

export async function getPublicLabSettings(): Promise<PublicLabSettings> {
  const { clientSecretEnc, webhookSecretEnc, ...rest } = await getLabSettings()
  return {
    ...rest,
    hasClientSecret: Boolean(clientSecretEnc),
    hasWebhookSecret: Boolean(webhookSecretEnc),
  }
}

/**
 * Upsert the lab settings. A blank secret preserves the stored one, matching
 * the email settings convention so the admin never has to re-type a credential
 * to change an unrelated field.
 */
export async function saveLabSettings(
  input: LabSettingsInput,
  actorUserId?: string | null,
): Promise<PublicLabSettings> {
  const current = await getLabSettings()
  const t = (v: string) => v.trim()

  const value: StoredLabSettings = {
    enabled: input.enabled,
    baseUrl: t(input.baseUrl).replace(/\/+$/, ""),
    tokenUrl: t(input.tokenUrl),
    clientId: t(input.clientId),
    clientSecretEnc: input.clientSecret
      ? encryptSecret(input.clientSecret)
      : current.clientSecretEnc,
    slotsPath: t(input.slotsPath),
    bookHomePath: t(input.bookHomePath),
    bookCenterPath: t(input.bookCenterPath),
    cancelHomePath: t(input.cancelHomePath),
    rescheduleHomePath: t(input.rescheduleHomePath),
    cancelCenterPath: t(input.cancelCenterPath),
    rescheduleCenterPath: t(input.rescheduleCenterPath),
    productsPath: t(input.productsPath),
    partnerSource: t(input.partnerSource),
    webhookSecretEnc: input.webhookSecret
      ? encryptSecret(input.webhookSecret)
      : current.webhookSecretEnc,
    allowUnauthenticatedWebhooks: input.allowUnauthenticatedWebhooks,
    patientBookingEnabled: input.patientBookingEnabled,
  }

  await writeSetting(LAB_SETTINGS_KEY, value)
  clearLabSettingsCache()

  // Configuration changes were previously unaudited. These ones alter how we
  // talk to a third party and whether inbound webhooks are authenticated, so
  // record who changed what — secrets as booleans only, never the values.
  await recordAudit({
    actorUserId: actorUserId ?? null,
    action: "UPDATE",
    entityType: "Setting",
    entityId: LAB_SETTINGS_KEY,
    detail: {
      enabled: value.enabled,
      partnerSource: value.partnerSource,
      allowUnauthenticatedWebhooks: value.allowUnauthenticatedWebhooks,
      patientBookingEnabled: value.patientBookingEnabled,
      clientSecretChanged: Boolean(input.clientSecret),
      webhookSecretChanged: Boolean(input.webhookSecret),
    },
  })

  return getPublicLabSettings()
}
