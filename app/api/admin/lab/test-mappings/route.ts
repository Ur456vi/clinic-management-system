/**
 * `/api/admin/lab/test-mappings`  (ADMIN)
 *
 *   GET — the synced partner catalogue plus every mapping saved so far.
 *   PUT — save changed mappings. A blank `labTestId` removes the mapping.
 *
 * Our consultation panel offers ~93 clinic tests; Mahajan's catalogue is a
 * handful of bundled products, and none of the names match. Name-based
 * matching therefore resolves nothing, and every prescribed test ends up
 * unmapped — which now blocks booking outright.
 *
 * These curated rows are the bridge. `LabTestMapping.testKey` is unique but
 * `labTestId` is not, so MANY of our tests may point at ONE partner product —
 * that is the normal case here, not an edge case.
 *
 * The client sends only the test key and the product id. The product's display
 * name is looked up here rather than trusted from the request, so a stale page
 * cannot persist a name that no longer matches the code.
 */

import { Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, requireRole, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import { recordAudit } from "@/lib/services/audit"

export const GET = defineHandler(async () => {
  await requireRole(Role.ADMIN)

  const [products, mappings] = await Promise.all([
    db.labProduct.findMany({
      orderBy: { testName: "asc" },
      select: { labTestId: true, testName: true },
    }),
    db.labTestMapping.findMany({ select: { testKey: true, labTestId: true } }),
  ])

  return ok({
    products,
    mappings: Object.fromEntries(mappings.map((m) => [m.testKey, m.labTestId])),
  })
})

const bodySchema = z.object({
  mappings: z
    .array(
      z.object({
        testKey: z.string().trim().min(1).max(300),
        /** Blank removes the mapping. */
        labTestId: z.string().trim().max(120),
      }),
    )
    .max(500),
})

export const PUT = defineHandler(async ({ req }) => {
  const session = await requireRole(Role.ADMIN)
  const { mappings } = bodySchema.parse(await req.json())
  if (mappings.length === 0) return ok({ saved: 0, removed: 0 })

  const wanted = mappings.filter((m) => m.labTestId !== "")
  const removals = mappings.filter((m) => m.labTestId === "").map((m) => m.testKey)

  // Resolve names from our synced catalogue, and reject unknown codes rather
  // than writing a mapping that can never resolve to a real product.
  const ids = Array.from(new Set(wanted.map((m) => m.labTestId)))
  const products = ids.length
    ? await db.labProduct.findMany({
        where: { labTestId: { in: ids } },
        select: { labTestId: true, testName: true },
      })
    : []
  const nameById = new Map(products.map((p) => [p.labTestId, p.testName]))

  const unknown = ids.filter((id) => !nameById.has(id))
  if (unknown.length > 0) {
    throw new ValidationError(
      `Unknown partner test code: ${unknown.join(", ")}. Re-run the catalogue sync and try again.`,
    )
  }

  await db.$transaction([
    ...(removals.length
      ? [db.labTestMapping.deleteMany({ where: { testKey: { in: removals } } })]
      : []),
    ...wanted.map((m) =>
      db.labTestMapping.upsert({
        where: { testKey: m.testKey },
        create: {
          testKey: m.testKey,
          labTestId: m.labTestId,
          labTestName: nameById.get(m.labTestId)!,
        },
        update: {
          labTestId: m.labTestId,
          labTestName: nameById.get(m.labTestId)!,
        },
      }),
    ),
  ])

  await recordAudit({
    actorUserId: (session as { userId?: string }).userId ?? null,
    action: "UPDATE",
    entityType: "LabTestMapping",
    entityId: null,
    detail: { saved: wanted.length, removed: removals.length },
  })

  return ok({ saved: wanted.length, removed: removals.length })
})
