/**
 * Resolve OUR selected catalog test keys into partner order lines.
 *
 * Resolution order per test key:
 *   1. Curated `LabTestMapping` (explicit override) — wins.
 *   2. Normalized exact-name match against the `LabProduct` cache.
 *   3. Unmapped — still emitted with `labTestId: null` so the order carries
 *      the test by name and an admin can map it later. Never silently dropped.
 */

import { db } from "@/lib/db"
import { lookupTest } from "@/lib/test-catalog"

import { normalizeTestName } from "./normalize"

export type ResolvedItem = {
  /** Our catalog key (`panelId::testName`). */
  testKey: string
  /** Human test name (from the catalog, falling back to the key tail). */
  testName: string
  /** Partner item id, or null when unmapped. */
  labTestId: string | null
  /** Partner display name when resolved. */
  labTestName: string | null
  /** How it resolved — for diagnostics on the order. */
  source: "mapping" | "name-match" | "unmapped"
}

/** Human name for one of our test keys. */
function testNameForKey(testKey: string): string {
  const hit = lookupTest(testKey)
  if (hit) return hit.name
  return (testKey.split("::").pop() ?? testKey).trim()
}

/**
 * Resolve every key. Batches the two cache lookups so this is 2 queries
 * regardless of test count.
 */
/**
 * Reads only two config-like tables, so it can run on either the request client
 * or a caller's transaction. Callers inside a transaction should pass `tx` so
 * the lookup joins their snapshot rather than opening a second connection.
 */
type MappingReader = Pick<typeof db, "labTestMapping" | "labProduct">

export async function resolveItems(
  testKeys: string[],
  client: MappingReader = db,
): Promise<ResolvedItem[]> {
  const keys = Array.from(new Set(testKeys))
  if (keys.length === 0) return []

  // 1. Curated overrides.
  const mappings = await client.labTestMapping.findMany({
    where: { testKey: { in: keys } },
  })
  const byKey = new Map(mappings.map((m) => [m.testKey, m]))

  // 2. Normalized name match for the remainder.
  const unmappedKeys = keys.filter((k) => !byKey.has(k))
  const normByKey = new Map(unmappedKeys.map((k) => [k, normalizeTestName(testNameForKey(k))]))
  const norms = Array.from(new Set(normByKey.values())).filter(Boolean)
  const products = norms.length
    ? await client.labProduct.findMany({ where: { normalized: { in: norms } } })
    : []
  const productByNorm = new Map(products.map((p) => [p.normalized, p]))

  return keys.map((testKey): ResolvedItem => {
    const name = testNameForKey(testKey)
    const mapping = byKey.get(testKey)
    if (mapping) {
      return {
        testKey,
        testName: name,
        labTestId: mapping.labTestId,
        labTestName: mapping.labTestName,
        source: "mapping",
      }
    }
    const norm = normByKey.get(testKey) ?? ""
    const product = norm ? productByNorm.get(norm) : undefined
    if (product) {
      return {
        testKey,
        testName: name,
        labTestId: product.labTestId,
        labTestName: product.testName,
        source: "name-match",
      }
    }
    return { testKey, testName: name, labTestId: null, labTestName: null, source: "unmapped" }
  })
}
