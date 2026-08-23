/**
 * Lab partner HTTP client.
 *
 * Handles OAuth2 client-credentials authentication (token cached in-process
 * with a conservative TTL, refreshed on 401) and a thin `labFetch` wrapper
 * that targets the partner apexrest base with the bearer token attached.
 *
 * The partner endpoints expect `?Content_type=application/json` on the query
 * string (per the UAT Postman collection), so we append it automatically.
 */

import { logger } from "@/lib/logger"

import { getLabConfig } from "./config"

const log = logger.child({ mod: "lab-client" })

// Salesforce client-credentials tokens carry no `expires_in`; lifetime is
// governed by the connected-app session policy. Cache conservatively and let
// a 401 trigger a forced refresh + single retry.
const TOKEN_TTL_MS = 90 * 60 * 1000

type CachedToken = { token: string; expiresAt: number }
let cache: CachedToken | null = null

function nowMs(): number {
  return Date.now()
}

async function fetchToken(): Promise<string> {
  const cfg = getLabConfig()
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  })

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // Never cache auth calls.
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(
      `Lab OAuth token request failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`,
    )
  }

  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) {
    throw new Error("Lab OAuth token response missing access_token")
  }
  cache = { token: json.access_token, expiresAt: nowMs() + TOKEN_TTL_MS }
  return json.access_token
}

/** Get a valid bearer token, using the in-process cache when fresh. */
async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cache && cache.expiresAt > nowMs()) {
    return cache.token
  }
  return fetchToken()
}

/** Clear the cached token (test hook / manual invalidation). */
export function clearTokenCache(): void {
  cache = null
}

export type LabFetchOptions = {
  method?: "GET" | "POST"
  /** JSON body (POST). Serialized with JSON.stringify. */
  body?: unknown
  /** Extra query params merged onto the URL. */
  query?: Record<string, string>
  /** AbortSignal timeout budget (ms). Default 20s. */
  timeoutMs?: number
}

export type LabResponse = {
  ok: boolean
  status: number
  /** Parsed JSON when the body is JSON, else the raw text. */
  data: unknown
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const cfg = getLabConfig()
  const url = new URL(`${cfg.baseUrl}${path}`)
  // Partner apexrest expects this on every call.
  url.searchParams.set("Content_type", "application/json")
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  }
  return url.toString()
}

async function doFetch(
  url: string,
  method: "GET" | "POST",
  token: string,
  body: unknown,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
      cache: "no-store",
    })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Authenticated call to a partner apexrest endpoint. Retries once on a 401
 * with a freshly minted token (covers session expiry). Throws on network
 * failure / timeout; returns a structured `LabResponse` otherwise (caller
 * decides how to treat a non-2xx).
 */
export async function labFetch(
  path: string,
  opts: LabFetchOptions = {},
): Promise<LabResponse> {
  const method = opts.method ?? "GET"
  const timeoutMs = opts.timeoutMs ?? 20_000
  const url = buildUrl(path, opts.query)

  let token = await getToken()
  let res = await doFetch(url, method, token, opts.body, timeoutMs)

  if (res.status === 401) {
    log.warn({ path }, "lab call 401 — refreshing token and retrying once")
    token = await getToken(true)
    res = await doFetch(url, method, token, opts.body, timeoutMs)
  }

  const text = await res.text().catch(() => "")
  let data: unknown = text
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // leave as raw text
    }
  }

  return { ok: res.ok, status: res.status, data }
}
