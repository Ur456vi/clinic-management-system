/**
 * GET /api/health
 *
 * Lightweight liveness probe. Anonymous (no `requireSession()` call) so
 * that load balancers, uptime monitors, and the dev workflow can poll
 * it without credentials.
 *
 * Demonstrates the standard `defineHandler` + `ok()` pattern.
 */

import packageJson from "@/package.json"
import { defineHandler, ok } from "@/lib/api"

export const GET = defineHandler(async () => {
  return ok({
    status: "ok",
    time: new Date().toISOString(),
    version: (packageJson as { version: string }).version,
  })
})
