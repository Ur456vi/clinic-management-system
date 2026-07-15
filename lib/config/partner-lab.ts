/**
 * Partner-lab integration config.
 *
 * The inbound webhook (`POST /api/webhooks/partner-lab`) is authenticated with
 * a shared bearer token the partner lab sends in a request header. We read the
 * token from `PARTNER_LAB_WEBHOOK_TOKEN` and fall back to a documented dev
 * default so local dev + the demo work without an `.env` edit — mirroring the
 * env-with-default pattern in `lib/services/razorpay.ts`.
 *
 * IMPORTANT: set `PARTNER_LAB_WEBHOOK_TOKEN` to a real secret in UAT/prod. The
 * dev default is intentionally non-secret and must never gate real traffic.
 */

/** Header the partner lab sends the shared token in. */
export const PARTNER_LAB_WEBHOOK_HEADER = "x-partner-lab-token"

/** Dev default — overridden by `PARTNER_LAB_WEBHOOK_TOKEN` when set. */
const DEFAULT_WEBHOOK_TOKEN = "dev-partner-lab-token"

/** The configured shared webhook token (env value, or the dev default). */
export function partnerLabWebhookToken(): string {
  const v = process.env.PARTNER_LAB_WEBHOOK_TOKEN
  return v && v.length > 0 ? v : DEFAULT_WEBHOOK_TOKEN
}

// ---------------------------------------------------------------------------
// Outbound API config
// ---------------------------------------------------------------------------
//
// The outbound flow (create/book an order on the lab's Salesforce) is gated by
// `PARTNER_LAB_API_ENABLED`. It ships OFF: until the real base URL, endpoint
// paths and credentials from the Postman collection are provided, the flow
// creates the local `PartnerLabOrder` rows but makes NO external call. Flip the
// flag on (and fill the values) once UAT creds are available.

function envStr(name: string): string | undefined {
  const v = process.env[name]
  return v && v.length > 0 ? v : undefined
}

export type PartnerLabApiConfig = {
  enabled: boolean
  baseUrl: string | undefined
  authPath: string
  orderPath: string
  clientId: string | undefined
  clientSecret: string | undefined
  /** `customer.source` — the partner-panel name the lab attributes orders to. */
  source: string
  /** Default `appointment.serviceTerritoryId` when a per-center one isn't set. */
  defaultServiceTerritoryId: string | undefined
  /** Request timeout for lab API calls, in milliseconds. */
  timeoutMs: number
}

/** Read the outbound API config from the environment (with safe defaults). */
export function partnerLabApiConfig(): PartnerLabApiConfig {
  return {
    enabled: process.env.PARTNER_LAB_API_ENABLED === "true",
    baseUrl: envStr("PARTNER_LAB_API_BASE_URL"),
    authPath: envStr("PARTNER_LAB_AUTH_PATH") ?? "/auth/token",
    orderPath: envStr("PARTNER_LAB_ORDER_PATH") ?? "/appointment/book",
    clientId: envStr("PARTNER_LAB_CLIENT_ID"),
    clientSecret: envStr("PARTNER_LAB_CLIENT_SECRET"),
    source: envStr("PARTNER_LAB_SOURCE") ?? "Vyara Clinic",
    defaultServiceTerritoryId: envStr("PARTNER_LAB_DEFAULT_SERVICE_TERRITORY_ID"),
    timeoutMs: Number(process.env.PARTNER_LAB_API_TIMEOUT_MS ?? "15000"),
  }
}
