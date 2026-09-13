/**
 * `GET /api/admin/lab/products`  (ADMIN)
 *
 * The synced partner test master (from GetAllPartnerProductsAPI), for the
 * catalogue list on Settings → Lab Integration.
 *
 * Read-only and deliberately small: until now `lab_products` had no reader at
 * all, so nobody could see what a sync had actually pulled in. That is part of
 * why the sync spent so long silently importing a different partner's
 * catalogue.
 *
 * `category` and `price` are not columns — they live in the raw partner record
 * we stash on each row, so they are picked out defensively here.
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"

function fromRaw(raw: unknown): { category: string | null; price: number | null } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { category: null, price: null }
  const r = raw as Record<string, unknown>
  const category = typeof r.productCategory === "string" ? r.productCategory : null
  const price =
    typeof r.unitPrice === "number"
      ? r.unitPrice
      : typeof r.unitPrice === "string" && r.unitPrice.trim() !== "" && !isNaN(Number(r.unitPrice))
        ? Number(r.unitPrice)
        : null
  return { category, price }
}

export const GET = defineHandler(async () => {
  await requireRole(Role.ADMIN)

  const rows = await db.labProduct.findMany({
    orderBy: { testName: "asc" },
    select: { labTestId: true, testName: true, raw: true, syncedAt: true },
  })

  const products = rows.map((p) => ({
    labTestId: p.labTestId,
    testName: p.testName,
    syncedAt: p.syncedAt.toISOString(),
    ...fromRaw(p.raw),
  }))

  return ok({ products, count: products.length })
})
