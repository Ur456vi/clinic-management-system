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
import { errorResponse } from "./errors"

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
      res = await fn({ req, params, requestId, startedAt })
    } catch (err) {
      // Log the unhandled throw with a stack before mapping it to a response.
      // `errorResponse` will also classify it (4xx warn / 5xx error) but this
      // line guarantees the stack is captured even if the mapper changes.
      log.error({ err }, "unhandled")
      res = errorResponse(err, { requestId })
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
