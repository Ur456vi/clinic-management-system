/**
 * CORS helpers (BE-52).
 *
 * Wired into `defineHandler` in `./handler.ts`. The allow-list is read
 * from `env.CORS_ALLOWED_ORIGINS` (comma-separated). If unset, only
 * `http://localhost:3000` is permitted.
 *
 * Behaviour:
 *   - `preflight(req)` returns a 204 Response for OPTIONS, else null.
 *     CORS headers are applied to the preflight response in `defineHandler`
 *     via `applyCors` immediately after.
 *   - `applyCors(req, res)` mutates `res.headers` to echo the request
 *     Origin only when it matches the allow-list. Sets `Vary: Origin`
 *     unconditionally so caches don't merge responses across origins.
 */

import { NextRequest } from "next/server"
import { env } from "@/lib/env"

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
const ALLOWED_HEADERS =
  "Content-Type, Authorization, X-Requested-With, X-Request-Id"

function allowList(): string[] {
  const list = env.CORS_ALLOWED_ORIGINS
  if (!list || list.length === 0) return ["http://localhost:3000"]
  return list
}

function isAllowed(origin: string | null): origin is string {
  if (!origin) return false
  return allowList().includes(origin)
}

/**
 * Apply CORS headers to an outgoing response. Safe to call on any response;
 * does nothing harmful when the request has no `Origin`.
 */
export function applyCors(req: NextRequest, res: Response): void {
  const origin = req.headers.get("origin")
  // Always set Vary so caches segment by origin even on rejections.
  try {
    res.headers.append("Vary", "Origin")
  } catch {
    // Some Response objects have immutable headers; ignore.
    return
  }
  if (isAllowed(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin)
    res.headers.set("Access-Control-Allow-Credentials", "true")
    res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS)
    res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS)
  }
}

/**
 * Handle a CORS preflight request. Returns a 204 Response when the request
 * method is OPTIONS; otherwise returns null so the caller can continue.
 *
 * Callers should still invoke `applyCors` on the returned response so the
 * allow-origin/credentials headers are populated.
 */
export function preflight(req: NextRequest): Response | null {
  if (req.method !== "OPTIONS") return null
  return new Response(null, { status: 204 })
}
