/** Live READ-ONLY verification of the sync field-mapping + slot parsing fixes. */
import { labFetch } from "@/lib/services/lab/client"

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : undefined)
const pick = (r: Record<string, unknown>, keys: string[]) => { for (const k of keys) { const v = str(r[k]); if (v) return v } return null }

async function main() {
  // 1. Products → confirm labTestId now resolves from productCode.
  const p = await labFetch("/services/apexrest/getAllProducts", { method: "GET" })
  const products = ((p.data as Record<string, unknown>)?.products as Record<string, unknown>[]) ?? []
  const mapped = products.slice(0, 3).map((r) => ({
    labTestId: pick(r, ["testId", "TestId", "ItemID", "itemId", "productCode", "productId", "code", "id"]),
    testName: pick(r, ["testName", "TestName", "productName", "name", "itemName"]),
  }))
  const resolved = products.filter((r) => pick(r, ["testId", "productCode", "productId", "code", "id"])).length
  console.log(`\nPRODUCTS: ${products.length} returned, ${resolved} resolve a testId`)
  console.log("  sample:", JSON.stringify(mapped))

  // 2. Slots → replicate parseSlots (members[].availableSlots + territory/member ids).
  const s = await labFetch("/services/apexrest/getAvailableSlots", { method: "POST", body: { pincode: "110030", preferredDateTime: "2026-09-10 10:00:00" } })
  const raw = s.data as Record<string, unknown>
  const territoryId = str((raw.serviceTerritory as Record<string, unknown>)?.id)
  const out: { startTime: string; serviceTerritoryId?: string; serviceMemberId?: string }[] = []
  for (const m of (raw.members as Record<string, unknown>[]) ?? []) {
    const memberId = str(m.serviceMemberId)
    for (const sl of (m.availableSlots as Record<string, unknown>[]) ?? []) {
      const start = str(sl.startTime); if (start) out.push({ startTime: start, serviceTerritoryId: territoryId, serviceMemberId: memberId })
    }
  }
  console.log(`\nSLOTS: parsed ${out.length}, territoryId=${territoryId}`)
  console.log("  first:", JSON.stringify(out[0]))
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
