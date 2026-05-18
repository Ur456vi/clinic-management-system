/**
 * `/api/ready` readiness probe (BE-55).
 *
 * Confirms the API process can reach Postgres. Returns 200 when a
 * `SELECT 1` round-trip succeeds within ~2 s; otherwise 503. Used by
 * the load balancer / EC2 health check (INF-05 / INF-08) to gate
 * traffic during deploys and cold-starts.
 *
 * Liveness lives in `/api/health` — that one only confirms the
 * Node process is alive. Readiness is the stricter signal.
 */

import { NextResponse } from "next/server"
import { defineHandler } from "@/lib/api"
import { db } from "@/lib/db"

/** Max time we'll wait for the DB round-trip before declaring not-ready. */
const DB_PING_TIMEOUT_MS = 2_000

/** Reject after `ms` milliseconds with a tagged error so we can branch on it. */
function timeoutAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`db ping timed out after ${ms}ms`)), ms)
  })
}

export const GET = defineHandler(async () => {
  const checkedAt = () => new Date().toISOString()

  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      timeoutAfter(DB_PING_TIMEOUT_MS),
    ])

    return NextResponse.json(
      { ready: true, db: "ok", checkedAt: checkedAt() },
      { status: 200 },
    )
  } catch (err) {
    // Surface only the error message — never the connection string or
    // any query parameters (no PHI ever reaches this code path, but be
    // defensive anyway).
    const message = err instanceof Error ? err.message : "unknown error"

    return NextResponse.json(
      {
        ready: false,
        db: "down",
        error: message,
        checkedAt: checkedAt(),
      },
      { status: 503 },
    )
  }
})
