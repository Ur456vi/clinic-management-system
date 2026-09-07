/**
 * `POST /api/admin/lab/sync`  (ADMIN only)
 *
 * Refresh the local caches of the partner masters. Body:
 *   { target: "products" | "centers" | "all" }   (default "all")
 *
 * Requires the lab integration to be enabled + configured (it makes live
 * partner calls). Returns per-target fetched/upserted counts.
 */

import { Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, ValidationError, requireRole } from "@/lib/api"
import { isLabEnabled, syncCenters, syncProducts } from "@/lib/services/lab"

const bodySchema = z.object({
  target: z.enum(["products", "centers", "all"]).default("all"),
})

export const POST = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN)

  if (!isLabEnabled()) {
    throw new ValidationError(
      "Lab integration is disabled or not configured (LAB_INTEGRATION_ENABLED + LAB_BASE_URL + LAB_OAUTH_*).",
    )
  }

  const raw = await req.json().catch(() => ({}))
  const { target } = bodySchema.parse(raw)

  const result: Record<string, unknown> = {}
  if (target === "products" || target === "all") result.products = await syncProducts()
  if (target === "centers" || target === "all") result.centers = await syncCenters()

  return ok(result)
})
