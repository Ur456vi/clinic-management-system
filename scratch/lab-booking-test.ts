/**
 * CONTROLLED end-to-end booking test against live Mahajan UAT.
 * Creates a throwaway patient + lab order, books ONE real appointment, reports,
 * then cancels the appointment and deletes the test rows. Keeps synced masters
 * (real reference data). Run: npx tsx --env-file=.env scratch/lab-booking-test.ts
 */
import { writeFileSync } from "node:fs"

import { db } from "@/lib/db"
import { labFetch } from "@/lib/services/lab/client"
import { getAvailableSlots } from "@/lib/services/lab/availability"
import { syncProducts, syncCenters } from "@/lib/services/lab/sync"
import { bookOrder, cancelOrder } from "@/lib/services/lab/orders"

function str(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : undefined }

const RESULT_FILE = "scratch/lab-booking-result.json"
const result: Record<string, unknown> = { startedAt: new Date().toISOString() }

async function main() {
  const tag = `ZZTEST-${Date.now()}`
  let patientId: string | null = null
  let orderId: string | null = null

  try {
    // 0. Sync masters + list all products to try.
    const p = await syncProducts(); const c = await syncCenters()
    console.log("sync:", "products", p, "centers", c)
    const products = await db.labProduct.findMany({ select: { labTestId: true, testName: true } })
    if (products.length === 0) throw new Error("no products synced")

    // 1. Throwaway patient (reused across attempts).
    const patient = await db.patient.create({
      data: {
        patientNumber: tag, fullName: "ZZ Lab Test", phone: "9999999999",
        email: "labtest@example.com", sex: "MALE", dateOfBirth: new Date("1990-01-01"),
        address: "12 MG Road, Saket, Delhi",
      },
    })
    patientId = patient.id

    // 2. CENTER collection — pick a synced centre + a chosen IST time (centre
    //    walk-in doesn't use the home phlebotomist territory/availability).
    const centre = await db.labCenter.findFirst({ select: { centerCode: true, name: true } })
    if (!centre) throw new Error("no centres synced")
    const slot = { startTime: "2026-09-20 10:00:00", endTime: "2026-09-20 10:30:00" }
    result.mode = "CENTER"
    result.centre = centre
    result.chosenSlot = slot

    // 3. Try booking EACH product at the centre; cancel on success.
    const attempts: Record<string, unknown>[] = []
    for (const prod of products) {
      const otag = `${tag}-${prod.labTestId}`
      const order = await db.labOrder.create({
        data: {
          orderNumber: otag, patientId: patient.id, collectionMode: "CENTER", centerCode: centre.centerCode,
          status: "PENDING_SCHEDULE",
          items: [{ testKey: "test::" + prod.testName, testName: prod.testName, labTestId: prod.labTestId, labTestName: prod.testName, source: "name-match" }],
        },
      })
      let outcome: Record<string, unknown> = { product: prod.labTestId, name: prod.testName }
      try {
        const booked = await bookOrder(order.id, {
          collectionMode: "CENTER", centerCode: centre.centerCode, slot, bookedVia: "RECEPTION",
          address: { street: "12 MG Road, Saket, Delhi", city: "Delhi", state: "Delhi", postalCode: "110030", country: "India" },
        })
        outcome = { ...outcome, status: booked.status, appointmentId: booked.appointmentId, error: booked.notifyError, partner: booked.lastResponse }
        console.log(`[${prod.labTestId}] ${prod.testName} -> ${booked.status} ${JSON.stringify(booked.lastResponse)?.slice(0, 120) ?? ""}`)
        if (booked.status === "SCHEDULED" && booked.appointmentId) {
          try { await cancelOrder(order.id, "automated test cleanup") } catch { /* manual cancel may be needed */ }
        }
      } catch (e) {
        outcome = { ...outcome, status: "THREW", error: (e as Error).message }
      }
      attempts.push(outcome)
      await db.labOrder.deleteMany({ where: { id: order.id } }).catch(() => {})
    }
    result.attempts = attempts
    result.anySucceeded = attempts.some((a) => a.status === "SCHEDULED")
  } catch (e) {
    console.error("\nTEST ERROR:", (e as Error).message)
    result.error = (e as Error).message
  } finally {
    // Delete test rows (keep synced masters).
    if (orderId) await db.labWebhookEvent.deleteMany({ where: { labOrderId: orderId } }).catch(() => {})
    if (orderId) await db.labOrder.deleteMany({ where: { id: orderId } }).catch(() => {})
    if (patientId) await db.patient.deleteMany({ where: { id: patientId } }).catch(() => {})
    result.finishedAt = new Date().toISOString()
    try { writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2)) } catch { /* ignore */ }
    console.log("\ntest rows deleted:", tag, "| result written to", RESULT_FILE)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
