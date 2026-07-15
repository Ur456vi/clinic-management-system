/**
 * End-to-end verification for the partner-lab OUTBOUND flow.
 *
 * Covers:
 *   1. Sign a MAIN consultation (API disabled) -> LabResult panel row AND a
 *      PartnerLabOrder created (orderNumber, labResultId, mapped items,
 *      unmapped listed, status CREATED, no external call).
 *   2. Idempotent: re-running createOutboundLabOrders makes no duplicate.
 *   3. Send with the API enabled against a local stub -> ACKNOWLEDGED +
 *      externalOrderId.
 *   4. Send against an unreachable endpoint -> FAILED, no throw escapes.
 *
 * All fixtures are deleted at the end. Run directly (no dev server needed):
 *   npx tsx scripts/verify-partner-lab-outbound.ts
 */

import { createServer, type Server } from "node:http"

import { db } from "@/lib/db"
import { transitionConsultation } from "@/lib/services/consultation"
import { createOutboundLabOrders, sendOutboundLabOrder } from "@/lib/services/partner-lab"
import { resetTokenCache } from "@/lib/services/partner-lab-client"
import { TEST_CATALOG, testKey } from "@/lib/test-catalog"

let failures = 0
function check(name: string, cond: boolean, extra?: unknown) {
  if (!cond) failures++
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name}${extra !== undefined ? ` :: ${JSON.stringify(extra)}` : ""}`)
}

function startStub(): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        res.setHeader("content-type", "application/json")
        if (req.url?.includes("/auth")) {
          res.end(JSON.stringify({ access_token: "stub-token", expires_in: 3600 }))
        } else {
          res.end(JSON.stringify({ orderId: "SF-STUB-9001" }))
        }
      })
    })
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      const port = typeof addr === "object" && addr ? addr.port : 0
      resolve({ server, url: `http://127.0.0.1:${port}` })
    })
  })
}

async function main() {
  const stamp = Date.now()
  // Pick a real catalog test to map.
  const panel = TEST_CATALOG[0].panels[0]
  const testName = panel.tests[0]
  const selectedKey = testKey(panel.id, testName)
  const panelName = `(${panel.code}) ${panel.name}`.slice(0, 200)

  // --- Seed -----------------------------------------------------------------
  const user = await db.user.create({
    data: { email: `verify-doc-${stamp}@example.com`, passwordHash: "x", role: "DOCTOR" },
  })
  const patient = await db.patient.create({
    data: {
      patientNumber: `VERIFY/OUT/${stamp}`,
      fullName: "Sparsh Bhayare",
      phone: "9999473969",
      email: "sparsh@example.com",
      sex: "MALE",
      dateOfBirth: new Date("1990-05-12"),
      address: "12 MG Road, Saket, Delhi",
    },
  })
  const mapping = await db.labTestMapping.create({
    data: {
      testKey: selectedKey,
      testName,
      labTestId: "LSHHI26930",
      labTestName: "FISH: FOLLICULAR LYMPHOMA",
      active: true,
    },
  })
  const consultation = await db.consultation.create({
    data: {
      patientId: patient.id,
      type: "MAIN",
      status: "IN_PROGRESS",
      sections: { test: { test__selected_tests: JSON.stringify([selectedKey]) } },
    },
  })
  console.log(`Seeded user=${user.id} patient=${patient.id} consultation=${consultation.id} test="${testName}"`)

  const cleanup = async () => {
    await db.partnerLabOrder.deleteMany({ where: { consultationId: consultation.id } })
    await db.labResult.deleteMany({ where: { consultationId: consultation.id } })
    await db.consultation.deleteMany({ where: { id: consultation.id } })
    await db.labTestMapping.deleteMany({ where: { id: mapping.id } })
    await db.patient.deleteMany({ where: { id: patient.id } })
    await db.user.deleteMany({ where: { id: user.id } })
  }

  try {
    // --- 1. Sign (API disabled) --------------------------------------------
    console.log("\n1) sign consultation (API disabled)")
    delete process.env.PARTNER_LAB_API_ENABLED
    await transitionConsultation(consultation.id, { to: "SIGNED" }, { userId: user.id, role: "DOCTOR" })
    // give the detached background send a moment (it's a no-op while disabled)
    await new Promise((r) => setTimeout(r, 300))

    const labRow = await db.labResult.findFirst({ where: { consultationId: consultation.id } })
    check("LabResult panel row created", labRow?.panelName === panelName, labRow?.panelName)
    const order = await db.partnerLabOrder.findFirst({ where: { consultationId: consultation.id } })
    check("PartnerLabOrder created", !!order)
    check("orderNumber has IPHMH-LAB prefix", !!order?.orderNumber.startsWith("IPHMH-LAB/"), order?.orderNumber)
    check("linked to the panel LabResult", order?.labResultId === labRow?.id)
    check("status CREATED (not sent)", order?.status === "CREATED", order?.status)
    const snap = (order?.requestSnapshot ?? {}) as Record<string, unknown>
    const items = (snap.items as Array<Record<string, unknown>>) ?? []
    check("snapshot item mapped to lab testId", items[0]?.testId === "LSHHI26930", items[0])

    // --- 2. Idempotency ----------------------------------------------------
    console.log("\n2) idempotent re-create")
    const again = await db.$transaction((tx) =>
      createOutboundLabOrders(tx, {
        consultationId: consultation.id,
        patientId: patient.id,
        sections: { test: { test__selected_tests: JSON.stringify([selectedKey]) } },
        orderedAt: new Date(),
      }),
    )
    check("no new orders created", again.length === 0, again.length)
    const count = await db.partnerLabOrder.count({ where: { consultationId: consultation.id } })
    check("still exactly one order", count === 1, count)

    // --- 3. Send against a local stub (ACKNOWLEDGED) -----------------------
    console.log("\n3) send with API enabled (stub)")
    const { server, url } = await startStub()
    process.env.PARTNER_LAB_API_ENABLED = "true"
    process.env.PARTNER_LAB_API_BASE_URL = url
    process.env.PARTNER_LAB_AUTH_PATH = "/auth/token"
    process.env.PARTNER_LAB_ORDER_PATH = "/appointment/book"
    resetTokenCache()
    if (order) await sendOutboundLabOrder(order.id)
    const sent = await db.partnerLabOrder.findUnique({ where: { id: order!.id } })
    check("status ACKNOWLEDGED", sent?.status === "ACKNOWLEDGED", sent?.status)
    check("externalOrderId stored", sent?.externalOrderId === "SF-STUB-9001", sent?.externalOrderId)
    server.close()

    // --- 4. Send against an unreachable endpoint (FAILED) ------------------
    console.log("\n4) send failure -> FAILED, no throw")
    // reset the order to CREATED so send will attempt again
    await db.partnerLabOrder.update({ where: { id: order!.id }, data: { status: "CREATED" } })
    process.env.PARTNER_LAB_API_BASE_URL = "http://127.0.0.1:1"
    resetTokenCache()
    let threw = false
    try {
      if (order) await sendOutboundLabOrder(order.id)
    } catch {
      threw = true
    }
    check("send did not throw", threw === false)
    const failed = await db.partnerLabOrder.findUnique({ where: { id: order!.id } })
    check("status FAILED", failed?.status === "FAILED", failed?.status)
    const fsnap = (failed?.requestSnapshot ?? {}) as Record<string, unknown>
    check("error captured on snapshot", typeof fsnap.error === "string", fsnap.error)
  } finally {
    await cleanup()
    console.log("\nCleaned up fixtures.")
  }

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
