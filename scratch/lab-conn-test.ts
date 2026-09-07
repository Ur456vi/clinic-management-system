/**
 * READ-ONLY live connectivity test for the MI Partner lab integration.
 * Calls OAuth + getAvailableSlots + getAllCenters/getAllProducts. None of these
 * create anything on the partner side. No booking is performed.
 * Run: npx tsx --env-file=.env scratch/lab-conn-test.ts
 */
import { isLabEnabled } from "@/lib/services/lab/config"
import { labFetch } from "@/lib/services/lab/client"
import { getAvailableSlots } from "@/lib/services/lab/availability"

function preview(v: unknown, n = 600): string {
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v)
    return s.length > n ? s.slice(0, n) + " …(truncated)" : s
  } catch {
    return String(v)
  }
}

async function main() {
  console.log("isLabEnabled():", isLabEnabled())
  if (!isLabEnabled()) {
    console.log("STILL A BLOCKER: integration disabled or missing base URL / OAuth creds.")
    return
  }

  // 1. OAuth + a read-only master pull (also proves token + base URL).
  try {
    const products = await labFetch("/services/apexrest/getAllProducts", { method: "GET" })
    console.log("\n[getAllProducts] ok:", products.ok, "status:", products.status)
    console.log("  body:", preview(products.data))
  } catch (e) {
    console.log("\n[getAllProducts] THREW:", (e as Error).message)
  }

  // 2. Centres (read-only).
  try {
    const centers = await labFetch("/services/apexrest/getAllCenters", { method: "GET" })
    console.log("\n[getAllCenters] ok:", centers.ok, "status:", centers.status)
    console.log("  body:", preview(centers.data))
  } catch (e) {
    console.log("\n[getAllCenters] THREW:", (e as Error).message)
  }

  // 3. Availability (read-only) — the call reception/patient make before booking.
  try {
    const slots = await getAvailableSlots({ pincode: "110030", preferredDateTime: "2026-09-15 10:00:00" })
    console.log("\n[getAvailableSlots] ok:", slots.ok, "status:", slots.status)
    console.log("  body:", preview(slots.slots, 900))
  } catch (e) {
    console.log("\n[getAvailableSlots] THREW:", (e as Error).message)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
