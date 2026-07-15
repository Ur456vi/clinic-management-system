/**
 * Partner-lab HTTP client (outbound).
 *
 * A thin `fetch` wrapper around the lab's Salesforce API — no DB, no Next.js.
 * The lab's guide: authenticate first, reuse the access token on subsequent
 * calls, re-authenticate when it expires. We cache the token at module scope
 * and refresh it on expiry or a 401.
 *
 * The whole client is gated by `PARTNER_LAB_API_ENABLED` (see
 * `lib/config/partner-lab.ts`). Callers must not invoke it when disabled — it
 * throws `PartnerLabApiError` to make a misconfiguration loud rather than
 * silently no-op.
 *
 * Exact endpoint paths, the auth request/response shape, and the order-id field
 * name are TBD until the Postman collection lands — the request builders here
 * follow the documented mandatory-field shape and extract the order id
 * tolerantly. Fill the config + adjust these two shapes when creds arrive.
 */

import { partnerLabApiConfig } from "@/lib/config/partner-lab"

export class PartnerLabApiError extends Error {
  readonly status: number | undefined
  readonly body: string | undefined
  constructor(message: string, opts: { status?: number; body?: string } = {}) {
    super(message)
    this.name = "PartnerLabApiError"
    this.status = opts.status
    this.body = opts.body
  }
}

/** The `{customer, appointment, order}` order payload we send the lab. */
export type OutboundOrderPayload = {
  customer: Record<string, unknown>
  appointment: Record<string, unknown>
  order: {
    orderNumber: string
    items: { testId: string; testName: string }[]
  }
}

export type CreateOrderResult = {
  /** The lab's own order id, when the response carries one. */
  externalOrderId: string | null
  /** The raw response body, for the order snapshot / debugging. */
  raw: unknown
}

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

type CachedToken = { token: string; expiresAt: number }
let cachedToken: CachedToken | null = null

/** Refresh a little early so an in-flight request never uses a just-expired token. */
const EXPIRY_SKEW_MS = 30_000

function baseUrlOrThrow(): string {
  const { baseUrl } = partnerLabApiConfig()
  if (!baseUrl) {
    throw new PartnerLabApiError("PARTNER_LAB_API_BASE_URL is not configured")
  }
  return baseUrl.replace(/\/+$/, "")
}

async function postJson(
  path: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<{ status: number; json: unknown; text: string }> {
  const { timeoutMs } = partnerLabApiConfig()
  const res = await fetch(`${baseUrlOrThrow()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: res.status, json, text }
}

/** Read a string field from a loosely-typed object by any of several keys. */
function pick(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null
  const rec = obj as Record<string, unknown>
  for (const k of keys) {
    const v = rec[k]
    if (typeof v === "string" && v.length > 0) return v
  }
  return null
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Obtain an access token, using the module cache when still valid. `force`
 * bypasses the cache (used on a 401 retry).
 */
export async function authenticate(force = false): Promise<string> {
  const cfg = partnerLabApiConfig()
  if (!cfg.enabled) {
    throw new PartnerLabApiError("partner-lab API is disabled")
  }
  const now = Date.now()
  if (!force && cachedToken && cachedToken.expiresAt - EXPIRY_SKEW_MS > now) {
    return cachedToken.token
  }

  // NOTE: request shape is a placeholder until the Postman collection lands.
  const { status, json, text } = await postJson(
    cfg.authPath,
    { clientId: cfg.clientId, clientSecret: cfg.clientSecret },
    {},
  )
  if (status < 200 || status >= 300) {
    throw new PartnerLabApiError("partner-lab authentication failed", { status, body: text })
  }

  const token = pick(json, ["access_token", "accessToken", "token"])
  if (!token) {
    throw new PartnerLabApiError("partner-lab auth response had no token", { status, body: text })
  }
  const expiresInSec = Number(
    (json as Record<string, unknown>)?.expires_in ??
      (json as Record<string, unknown>)?.expiresIn ??
      3600,
  )
  cachedToken = {
    token,
    expiresAt: now + (Number.isFinite(expiresInSec) ? expiresInSec : 3600) * 1000,
  }
  return token
}

/** Test/ops helper — drop the cached token so the next call re-authenticates. */
export function resetTokenCache(): void {
  cachedToken = null
}

// ---------------------------------------------------------------------------
// Create order
// ---------------------------------------------------------------------------

/**
 * Register the order with the lab (their "Book Appointment" / create-order
 * endpoint). Authenticates first (cached), retries once on a 401 with a fresh
 * token. Throws `PartnerLabApiError` on any non-2xx.
 */
export async function createLabOrder(
  payload: OutboundOrderPayload,
): Promise<CreateOrderResult> {
  const cfg = partnerLabApiConfig()
  if (!cfg.enabled) {
    throw new PartnerLabApiError("partner-lab API is disabled")
  }

  const send = async (token: string) =>
    postJson(cfg.orderPath, payload, { authorization: `Bearer ${token}` })

  let token = await authenticate()
  let { status, json, text } = await send(token)

  if (status === 401) {
    token = await authenticate(true)
    ;({ status, json, text } = await send(token))
  }

  if (status < 200 || status >= 300) {
    throw new PartnerLabApiError("partner-lab createLabOrder failed", { status, body: text })
  }

  return {
    externalOrderId: pick(json, [
      "orderId",
      "appointmentId",
      "id",
      "salesforceId",
      "externalOrderId",
    ]),
    raw: json,
  }
}
