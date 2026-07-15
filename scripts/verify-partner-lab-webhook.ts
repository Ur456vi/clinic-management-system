/**
 * End-to-end verification for the inbound partner-lab webhook (BE — partner lab).
 *
 * Seeds a patient + pending LabResult + PartnerLabOrder, then drives the live
 * route at `POST /api/webhooks/partner-lab` through every branch:
 *   1. bad token          -> 401, nothing written
 *   2. known order + RESULT_READY -> 200 matched, order advanced, LabResult reported
 *   3. duplicate delivery -> 200, processed exactly once (idempotent)
 *   4. unknown order       -> 200 matched:false, event UNMATCHED
 *
 * All fixtures use a `VERIFY-` order-number prefix and are deleted at the end.
 * Run with the dev server up:  BASE_URL=http://localhost:3000 npx tsx scripts/verify-partner-lab-webhook.ts
 */

import { db } from "@/lib/db"
import { partnerLabWebhookToken, PARTNER_LAB_WEBHOOK_HEADER } from "@/lib/config/partner-lab"

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"
const URL = `${BASE_URL}/api/webhooks/partner-lab`

let failures = 0
function check(name: string, cond: boolean, extra?: unknown) {
  const label = cond ? "PASS" : "FAIL"
  if (!cond) failures++
  console.log(`  [${label}] ${name}${extra !== undefined ? ` :: ${JSON.stringify(extra)}` : ""}`)
}

async function post(body: unknown, token: string | null) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { [PARTNER_LAB_WEBHOOK_HEADER]: token } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

async function main() {
  const token = partnerLabWebhookToken()
  const orderNumber = `VERIFY-${Date.now()}`
  const unknownOrderNumber = `VERIFY-UNKNOWN-${Date.now()}`

  // --- Seed -----------------------------------------------------------------
  const patient = await db.patient.create({
    data: {
      patientNumber: `VERIFY/PL/${Date.now()}`,
      fullName: "Partner Lab Verify Patient",
      phone: "9999999999",
    },
  })
  const labResult = await db.labResult.create({
    data: {
      patientId: patient.id,
      panelName: "(A) VERIFY PANEL",
      collectedAt: new Date(),
      reportedAt: null,
      analytes: [],
    },
  })
  const order = await db.partnerLabOrder.create({
    data: {
      orderNumber,
      patientId: patient.id,
      labResultId: labResult.id,
      status: "CREATED",
    },
  })
  console.log(`Seeded patient=${patient.id} labResult=${labResult.id} order=${orderNumber}`)

  try {
    // --- 1. Bad token -------------------------------------------------------
    console.log("\n1) bad token")
    const bad = await post({ orderNumber, status: "sample_collected" }, "wrong-token")
    check("status is 401", bad.status === 401, bad.status)
    const afterBad = await db.partnerLabOrder.findUnique({ where: { id: order.id } })
    check("order status unchanged (CREATED)", afterBad?.status === "CREATED", afterBad?.status)
    const eventsAfterBad = await db.labWebhookEvent.count({ where: { orderNumber } })
    check("no webhook event written", eventsAfterBad === 0, eventsAfterBad)

    // --- 2. Known order, RESULT_READY --------------------------------------
    console.log("\n2) known order + RESULT_READY")
    const payload = {
      eventId: `evt-${orderNumber}`,
      orderNumber,
      status: "result_ready",
      externalOrderId: "SF-0Hhe100000",
      report: {
        summary: "All within range",
        analytes: [
          { name: "Hemoglobin", value: 14.2, unit: "g/dL", refLow: 12, refHigh: 16 },
          { name: "WBC", value: 15000, unit: "/uL", refLow: 4000, refHigh: 11000 },
        ],
      },
    }
    const ok = await post(payload, token)
    check("status is 200", ok.status === 200, ok.status)
    check("matched true", ok.json?.data?.matched === true, ok.json?.data)
    check("status RESULT_READY", ok.json?.data?.status === "RESULT_READY", ok.json?.data?.status)
    const orderAfter = await db.partnerLabOrder.findUnique({ where: { id: order.id } })
    check("order advanced to RESULT_READY", orderAfter?.status === "RESULT_READY", orderAfter?.status)
    check("externalOrderId stored", orderAfter?.externalOrderId === "SF-0Hhe100000", orderAfter?.externalOrderId)
    const labAfter = await db.labResult.findUnique({ where: { id: labResult.id } })
    check("labResult.reportedAt set", labAfter?.reportedAt != null)
    check("labResult.summary set", labAfter?.summary === "All within range", labAfter?.summary)
    const analytes = (labAfter?.analytes as Array<Record<string, unknown>>) ?? []
    const wbc = analytes.find((a) => a.name === "WBC")
    check("WBC flagged HIGH (computed)", wbc?.flag === "HIGH", wbc?.flag)
    const evt = await db.labWebhookEvent.findFirst({ where: { orderNumber, status: "PROCESSED" } })
    check("webhook event PROCESSED", evt?.status === "PROCESSED", evt?.status)

    // --- 3. Duplicate delivery ---------------------------------------------
    console.log("\n3) duplicate delivery (same eventId)")
    const dup = await post(payload, token)
    check("status is 200", dup.status === 200, dup.status)
    const eventCount = await db.labWebhookEvent.count({ where: { orderNumber } })
    check("still exactly one event row (idempotent)", eventCount === 1, eventCount)

    // --- 4. Unknown order ---------------------------------------------------
    console.log("\n4) unknown order number")
    const unk = await post({ eventId: `evt-${unknownOrderNumber}`, orderNumber: unknownOrderNumber, status: "result_ready" }, token)
    check("status is 200", unk.status === 200, unk.status)
    check("matched false", unk.json?.data?.matched === false, unk.json?.data)
    const unkEvt = await db.labWebhookEvent.findFirst({ where: { orderNumber: unknownOrderNumber } })
    check("event marked UNMATCHED", unkEvt?.status === "UNMATCHED", unkEvt?.status)
  } finally {
    // --- Cleanup ------------------------------------------------------------
    await db.labWebhookEvent.deleteMany({ where: { orderNumber: { startsWith: "VERIFY-" } } })
    await db.partnerLabOrder.deleteMany({ where: { orderNumber: { startsWith: "VERIFY-" } } })
    await db.labResult.deleteMany({ where: { id: labResult.id } })
    await db.patient.deleteMany({ where: { id: patient.id } })
    console.log("\nCleaned up fixtures.")
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
