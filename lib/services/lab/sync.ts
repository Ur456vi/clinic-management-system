/**
 * Refresh the local caches of the partner masters:
 *   - `GetAllPartnerProductsAPI?panel=<our panel>` -> lab_products
 *   - `getAllCenters`                              -> lab_centers
 *
 * NOTE on the products endpoint: the partner also exposes a bare
 * `getAllProducts`, which returns 200 and looks fine but is ANOTHER partner's
 * catalogue (five Bajaj corporate packages) with none of our items in it. Ours
 * come only from `GetAllPartnerProductsAPI` filtered by our panel name, so the
 * `panel` query param is load-bearing, not optional.
 *
 * Both are admin-triggered (POST /api/admin/lab/sync). The partner responses
 * are loosely typed (Salesforce apexrest), so we defensively pull the id/name
 * out of a few likely field spellings and stash the whole record in `raw` for
 * later inspection / re-mapping.
 */

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import { labFetch } from "./client"
import { getLabConfig } from "./config"
import { normalizeTestName } from "./normalize"

const log = logger.child({ mod: "lab-sync" })

/** Pull the first present, non-empty string field from a record. */
function pick(rec: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k]
    if (typeof v === "string" && v.trim()) return v.trim()
    if (typeof v === "number") return String(v)
  }
  return null
}

/** Coerce a partner list response into an array of records. */
function asRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter(isRecord)
  if (isRecord(data)) {
    // Common apexrest envelope shapes: { products: [...] } / { data: [...] }.
    for (const key of ["products", "items", "data", "records", "centers", "result"]) {
      const v = data[key]
      if (Array.isArray(v)) return v.filter(isRecord)
    }
  }
  return []
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

export type SyncResult = { fetched: number; upserted: number }

/** Sync the partner test master into `lab_products`. */
export async function syncProducts(): Promise<SyncResult> {
  const cfg = await getLabConfig()
  const panel = cfg.partnerSource
  const res = await labFetch(cfg.paths.products, { method: "GET", query: { panel } })
  if (!res.ok) {
    throw new Error(`product sync failed for panel "${panel}": ${res.status}`)
  }
  const records = asRecords(res.data)
  let upserted = 0
  for (const rec of records) {
    // Mahajan getAllProducts returns { productCode, productName, unitPrice, ... }.
    const labTestId = pick(rec, ["testId", "TestId", "ItemID", "itemId", "productCode", "productId", "code", "id"])
    const testName = pick(rec, ["testName", "TestName", "productName", "name", "itemName"])
    if (!labTestId || !testName) continue
    await db.labProduct.upsert({
      where: { labTestId },
      create: {
        labTestId,
        testName,
        normalized: normalizeTestName(testName),
        raw: rec as object,
      },
      update: {
        testName,
        normalized: normalizeTestName(testName),
        raw: rec as object,
        syncedAt: new Date(),
      },
    })
    upserted++
  }
  log.info({ panel, fetched: records.length, upserted }, "synced lab products")
  return { fetched: records.length, upserted }
}

/** Sync the partner centre master into `lab_centers`. */
export async function syncCenters(): Promise<SyncResult> {
  const res = await labFetch("/services/apexrest/getAllCenters", { method: "GET" })
  if (!res.ok) {
    throw new Error(`getAllCenters failed: ${res.status}`)
  }
  const records = asRecords(res.data)
  let upserted = 0
  for (const rec of records) {
    const centerCode = pick(rec, ["CentreID", "centreId", "centerId", "centerCode", "code", "id"])
    const name = pick(rec, ["name", "centerName", "centreName", "CentreName"]) ?? centerCode
    if (!centerCode || !name) continue
    await db.labCenter.upsert({
      where: { centerCode },
      create: { centerCode, name, raw: rec as object },
      update: { name, raw: rec as object, syncedAt: new Date() },
    })
    upserted++
  }
  log.info({ fetched: records.length, upserted }, "synced lab centers")
  return { fetched: records.length, upserted }
}
