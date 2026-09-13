/**
 * `POST /api/admin/settings/lab/test`
 *
 * Verifies the currently-saved lab settings against the partner: mints an
 * OAuth token and calls their centres endpoint, which is the cheapest
 * read-only call they expose. ADMIN only.
 *
 * Reports the partner's own error rather than a generic failure, because the
 * useful distinction is *why* it failed — bad credentials, wrong base URL, or
 * a partner-side fault all look identical from the outside otherwise.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { clearTokenCache, labFetch } from "@/lib/services/lab/client"
import { getLabConfig, isLabEnabled } from "@/lib/services/lab/config"

export const POST = defineHandler(async () => {
  await requireRole(Role.ADMIN)

  if (!(await isLabEnabled())) {
    return ok({
      success: false,
      stage: "config",
      message:
        "Lab integration is switched off or missing a base URL, token URL, client id or client secret.",
    })
  }

  // Always test against what is saved right now, never a token minted from
  // older credentials.
  clearTokenCache()

  let cfg: Awaited<ReturnType<typeof getLabConfig>>
  try {
    cfg = await getLabConfig()
  } catch (err) {
    return ok({
      success: false,
      stage: "config",
      message: err instanceof Error ? err.message : "Could not resolve lab configuration",
    })
  }

  try {
    const res = await labFetch("/services/apexrest/getAllCenters", { method: "GET" })
    if (!res.ok) {
      return ok({
        success: false,
        stage: "partner",
        status: res.status,
        message: `Partner returned HTTP ${res.status}`,
        detail: res.data,
      })
    }
    const centers = (res.data as { centers?: unknown[] })?.centers
    return ok({
      success: true,
      stage: "partner",
      status: res.status,
      message: `Connected as "${cfg.partnerSource}". ${
        Array.isArray(centers) ? `${centers.length} centre(s) visible.` : "Partner responded."
      }`,
      detail: res.data,
    })
  } catch (err) {
    // Network failure, DNS, timeout, or the OAuth exchange itself failing.
    return ok({
      success: false,
      stage: "network",
      message: err instanceof Error ? err.message : "Could not reach the partner",
    })
  }
})
