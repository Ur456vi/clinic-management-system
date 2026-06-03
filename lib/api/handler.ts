/**
 * `defineHandler` — the wrapper every Route Handler should be defined with.
 *
 * It gives each request:
 *   - a unique `requestId` (uuid v4) — propagated to logs and added to the
 *     response as the `x-request-id` header so clients can quote it in bug
 *     reports;
 *   - a single try/catch that funnels any throw through `errorResponse()`,
 *     so route bodies never have to deal with HTTP error shapes;
 *   - a one-line access log: `[req-id] METHOD PATH -> STATUS in Xms`.
 *
 * Usage — non-dynamic route:
 *
 *   export const GET = defineHandler(async ({ req }) => {
 *     return ok({ hello: "world" })
 *   })
 *
 * Usage — dynamic route (`app/api/patients/[id]/route.ts`):
 *
 *   export const GET = defineHandler<{ id: string }>(async ({ params }) => {
 *     const { id } = await params
 *     return ok(await db.patient.findUniqueOrThrow({ where: { id } }))
 *   })
 */

import { NextRequest, NextResponse } from "next/server"
import { childLogger } from "../logger"
import { env } from "@/lib/env"
import { applyCors, preflight } from "./cors"
import { errorResponse, ForbiddenError } from "./errors"

export type HandlerContext<P = Record<string, string | string[]>> = {
  /** The incoming request. */
  req: NextRequest
  /**
   * The dynamic route params, exactly as Next.js delivers them: a Promise
   * resolving to an object keyed by the `[segment]` names. `await params`
   * inside the handler.
   */
  params: Promise<P>
  /** UUID v4 generated for this request — also set on the `x-request-id` header. */
  requestId: string
  /** Monotonic start time in ms (from `performance.now()`). */
  startedAt: number
}

export type RouteHandler<P = Record<string, string | string[]>> = (
  ctx: HandlerContext<P>,
) => Promise<Response>

/** Generate a request id. Prefers Web Crypto; falls back to a v4-shaped string. */
function newRequestId(): string {
  const g: { crypto?: { randomUUID?: () => string } } = globalThis as never
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  // RFC4122 v4-ish fallback for very old runtimes.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function pathOf(req: NextRequest): string {
  try {
    return new URL(req.url).pathname
  } catch {
    return req.nextUrl?.pathname ?? "<unknown>"
  }
}

const NO_PARAMS: Promise<Record<string, never>> = Promise.resolve({})

/**
 * Wrap a route function with logging + error catching. The returned function
 * matches the Next.js Route Handler signature
 * `(req, { params }) => Promise<Response>` and is safe to assign directly
 * to `GET`, `POST`, etc.
 */
export function defineHandler<P = Record<string, string | string[]>>(
  fn: RouteHandler<P>,
) {
  return async function wrappedHandler(
    req: NextRequest,
    ctx?: { params?: Promise<P> },
  ): Promise<Response> {
    const requestId = newRequestId()
    const startedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now()
    const method = req.method
    const path = pathOf(req)
    const params =
      (ctx?.params as Promise<P> | undefined) ?? (NO_PARAMS as Promise<P>)

    const log = childLogger(requestId)

    let res: Response
    try {
      const pre = preflight(req)
      if (pre) {
        res = pre
      } else {
        assertSameOriginIfMutating(req)
        res = await fn({ req, params, requestId, startedAt })
      }
    } catch (err) {
      // Log the unhandled throw with a stack before mapping it to a response.
      // `errorResponse` will also classify it (4xx warn / 5xx error) but this
      // line guarantees the stack is captured even if the mapper changes.
      log.error({ err }, "unhandled")
      res = errorResponse(err, { requestId })
    }

    // CORS headers go on every response (including errors + preflight).
    try {
      applyCors(req, res)
    } catch {
      // Headers may be immutable on some Response objects; the re-wrap
      // below for x-request-id also handles this case.
    }

    // Tag the outgoing response with the request id. We may receive an
    // immutable Response in edge cases; in that case re-wrap it.
    try {
      res.headers.set("x-request-id", requestId)
    } catch {
      res = new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: new Headers(res.headers),
      })
      res.headers.set("x-request-id", requestId)
    }

    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      startedAt
    const durationMs = Number(elapsed.toFixed(1))
    // Mirror the legacy `[req-id] METHOD PATH -> STATUS in Xms` line through
    // pino, with structured fields for log aggregation.
    log.info(
      {
        method,
        path,
        status: res.status,
        durationMs,
      },
      "request",
    )

    return res
  }
}

// ---------------------------------------------------------------------------
// CSRF — same-origin guard for mutating methods (BE-52)
// ---------------------------------------------------------------------------

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).host
  } catch {
    return null
  }
}

/**
 * Build the set of hosts we treat as "our own" for the same-origin check.
 *
 * In production the app runs behind a TLS-terminating ALB + nginx (see
 * `infra/terraform/modules/web`). The request that reaches Next.js is plain
 * HTTP and its `Host` header reflects the proxy's upstream, not the public
 * domain the browser used — so `req.nextUrl.host` alone is NOT a reliable
 * stand-in for the site's real origin. Relying on it rejected legitimate
 * same-site POSTs (the public booking form).
 *
 * The trusted set therefore combines:
 *   - the request host (`req.nextUrl.host`) — covers local dev / direct hits;
 *   - `X-Forwarded-Host` — the public host the proxy received;
 *   - operator-configured origins (`NEXT_PUBLIC_APP_URL`, `APP_URL`,
 *     `CORS_ALLOWED_ORIGINS`) — the authoritative public origin(s).
 *
 * These are all values we control. A genuine cross-origin attacker's Origin
 * matches none of them, so CSRF protection is preserved.
 */
/**
 * Production domains that are always trusted, regardless of env/proxy config.
 * Hardcoded as a belt-and-braces guard so the public site keeps working even
 * if a deploy ships with a missing/wrong `NEXT_PUBLIC_APP_URL`.
 */
const HARDCODED_TRUSTED_HOSTS = ["vyara.algoborne.com", "dryuvraajsingh.com"]

function trustedHosts(req: NextRequest): Set<string> {
  const hosts = new Set<string>(HARDCODED_TRUSTED_HOSTS)

  if (req.nextUrl?.host) hosts.add(req.nextUrl.host)

  // X-Forwarded-Host may be a comma-separated list (proxy chain) — the first
  // entry is the host the outermost proxy received from the client.
  const forwarded = req.headers.get("x-forwarded-host")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) hosts.add(first)
  }

  for (const origin of [
    env.NEXT_PUBLIC_APP_URL,
    env.APP_URL,
    ...(env.CORS_ALLOWED_ORIGINS ?? []),
  ]) {
    const h = hostOf(origin)
    if (h) hosts.add(h)
  }

  return hosts
}

/**
 * Reject cross-origin mutating requests by comparing the Origin (or Referer)
 * host with the set of hosts we trust as our own (see `trustedHosts`).
 * Webhooks under `/api/webhooks/` are exempt — they are authenticated by
 * signature, not by cookie.
 */
function assertSameOriginIfMutating(req: NextRequest): void {
  const method = req.method.toUpperCase()
  if (!MUTATING_METHODS.has(method)) return

  const pathname = req.nextUrl?.pathname ?? ""
  if (pathname.startsWith("/api/webhooks/")) return

  const originHost =
    hostOf(req.headers.get("origin")) ?? hostOf(req.headers.get("referer"))

  if (!originHost || !trustedHosts(req).has(originHost)) {
    throw new ForbiddenError("CSRF: cross-origin mutating request rejected")
  }
}

