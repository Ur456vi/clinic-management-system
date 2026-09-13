/**
 * Lab partner integration — resolved config + enablement gate.
 *
 * Every value resolves `db ?? env ?? built-in default`. The database side is
 * the admin Settings screen (./settings.ts); env remains the fallback, so a
 * deployment with no settings row behaves exactly as it did before the table
 * existed. That is deliberate — it means this can ship without a coordinated
 * data change, and clearing a field in the UI reverts to the deployed value
 * rather than breaking the integration.
 *
 * The whole feature is a no-op unless it is switched on AND the base URL +
 * OAuth credentials are present. Callers check `isLabEnabled()` before doing
 * network work; the outbound notify hook records the order locally regardless
 * so nothing is lost when the flag is off.
 *
 * These functions are async because they read the database. `getLabConfig()`
 * still throws when the integration is not usable — several callers
 * (`client.ts` fetchToken/buildUrl, `sync.ts` syncCenters) rely on that throw
 * as their only guard against firing a request at an unconfigured partner.
 */

import { decryptSecret } from "@/lib/crypto"
import { env } from "@/lib/env"

import { getLabSettings, type StoredLabSettings } from "./settings"

export type LabConfig = {
  baseUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  /** Partner-assigned panel name sent as `customer.source` on bookings. */
  partnerSource: string
  paths: {
    slots: string
    bookHome: string
    bookCenter: string
    cancelHome: string
    rescheduleHome: string
    cancelCenter: string
    rescheduleCenter: string
    products: string
  }
}

/** A stored string is "unset" when blank, so blank falls through to env. */
function str(dbValue: string, envValue: string | undefined, fallback = ""): string {
  return dbValue.trim() || envValue || fallback
}

/** Resolved values shared by the enablement check and the full config. */
function resolve(s: StoredLabSettings) {
  return {
    enabled: s.enabled ?? env.LAB_INTEGRATION_ENABLED,
    baseUrl: str(s.baseUrl, env.LAB_BASE_URL).replace(/\/+$/, ""),
    tokenUrl: str(s.tokenUrl, env.LAB_OAUTH_TOKEN_URL),
    clientId: str(s.clientId, env.LAB_CLIENT_ID),
  }
}

/** True only when the feature is switched on and fully configured. */
export async function isLabEnabled(): Promise<boolean> {
  const s = await getLabSettings()
  const r = resolve(s)
  const clientSecret = s.clientSecretEnc ? "set" : env.LAB_CLIENT_SECRET
  return Boolean(r.enabled && r.baseUrl && r.tokenUrl && r.clientId && clientSecret)
}

/**
 * Resolve the config or throw. Only call after `isLabEnabled()` returns true on
 * the paths that check it. The throw is a guard against misconfiguration, not
 * an expected control-flow branch.
 */
export async function getLabConfig(): Promise<LabConfig> {
  const s = await getLabSettings()
  const r = resolve(s)
  const clientSecret = s.clientSecretEnc
    ? decryptSecret(s.clientSecretEnc)
    : (env.LAB_CLIENT_SECRET ?? "")

  if (!r.enabled || !r.baseUrl || !r.tokenUrl || !r.clientId || !clientSecret) {
    throw new Error(
      "Lab integration is disabled or misconfigured. Set it up under Settings → Lab Integration, " +
        "or via LAB_INTEGRATION_ENABLED + LAB_BASE_URL + LAB_OAUTH_* env.",
    )
  }

  return {
    baseUrl: r.baseUrl,
    tokenUrl: r.tokenUrl,
    clientId: r.clientId,
    clientSecret,
    partnerSource: str(s.partnerSource, env.LAB_PARTNER_SOURCE),
    paths: {
      slots: str(s.slotsPath, env.LAB_SLOTS_PATH),
      bookHome: str(s.bookHomePath, env.LAB_BOOK_HOME_PATH),
      bookCenter: str(s.bookCenterPath, env.LAB_BOOK_CENTER_PATH),
      cancelHome: str(s.cancelHomePath, env.LAB_CANCEL_HOME_PATH),
      rescheduleHome: str(s.rescheduleHomePath, env.LAB_RESCHEDULE_HOME_PATH),
      cancelCenter: str(s.cancelCenterPath, env.LAB_CANCEL_CENTER_PATH),
      rescheduleCenter: str(s.rescheduleCenterPath, env.LAB_RESCHEDULE_CENTER_PATH),
      products: str(s.productsPath, env.LAB_PRODUCTS_PATH),
    },
  }
}

/**
 * Inbound-webhook settings. Separate from `getLabConfig()` and deliberately
 * non-throwing: a webhook must still authenticate (and be rejected) even when
 * the outbound integration is switched off or half-configured.
 */
export async function getWebhookSettings(): Promise<{
  secret: string
  allowUnauthenticated: boolean
}> {
  const s = await getLabSettings()
  const secret = s.webhookSecretEnc
    ? decryptSecret(s.webhookSecretEnc)
    : (env.LAB_WEBHOOK_SECRET ?? "")

  // env acts as a LOCK here, not just a default: an explicit `false` forces
  // authentication on and no admin can switch it off from the UI. Unset lets
  // the stored setting decide.
  const envAllow = env.LAB_WEBHOOK_ALLOW_UNAUTHENTICATED
  const allowUnauthenticated =
    envAllow === false ? false : (s.allowUnauthenticatedWebhooks ?? envAllow ?? false)

  return { secret, allowUnauthenticated }
}

/** Whether patients may self-book, rather than reception booking for them. */
export async function isPatientBookingEnabled(): Promise<boolean> {
  const s = await getLabSettings()
  return s.patientBookingEnabled ?? env.FEATURE_LAB_PATIENT_BOOKING
}
