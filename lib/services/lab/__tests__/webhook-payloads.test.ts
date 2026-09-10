/**
 * Inbound webhook contract tests, using the EXACT payload bodies from MI's
 * "MI Partner Webhooks Require" Postman collection.
 *
 * Two defects are pinned here, both found by replaying that collection:
 *  1. MI sends explicit `null` for inapplicable fields. The schemas used
 *     `.optional()`, so every centre `orderStatus` event failed to parse — and
 *     because `parse()` runs before `recordEvent()`, those events were 400'd
 *     and lost with no audit row.
 *  2. The `registrationStatus` shape parsed but was inert: `caseId`,
 *     `registrationStatus` and `labNumber` were all dropped, so "sample
 *     collected at centre" and "no-show" never moved the order.
 */

import { describe, expect, it } from "vitest"

import {
  centerStatusSchema,
  mapCenterOrderStatus,
  mapCenterRegistrationStatus,
  orderStatusSchema,
  reportStatusSchema,
} from "@/lib/validation/lab"

describe("appointment-order-status (Home)", () => {
  it("Completed — sample collected", () => {
    const p = orderStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      appointmentId: "08pe1000000FGCXAA4",
      status: "Completed",
    })
    expect(p.status).toBe("Completed")
  })

  it("Cannot Complete — keeps the reason", () => {
    const p = orderStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      appointmentId: "08pe1000000FGCXAA4",
      status: "Cannot Complete",
      reason: "Patient not reachable",
    })
    expect(p.reason).toBe("Patient not reachable")
  })
})

describe("centre-appointment-booking-status — orderStatus shape", () => {
  it("Completed (appointment confirmed) parses with null reason", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      orderCaseId: "500e1000005esriAAA",
      orderStatus: "Completed",
      workOrderId: "0WOe1000000rmGEGAY",
      appointmentDateTime: "2026-09-20 10:00:00",
      reason: null,
    })
    expect(p.workOrderId).toBe("0WOe1000000rmGEGAY")
    expect(p.appointmentDateTime).toBe("2026-09-20 10:00:00")
  })

  it("Cannot Complete parses with null workOrderId + appointmentDateTime", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      orderCaseId: "500e1000005esriAAA",
      orderStatus: "Cannot Complete",
      workOrderId: null,
      appointmentDateTime: null,
      reason: "Customer not answering the call",
    })
    expect(p.reason).toBe("Customer not answering the call")
  })

  it("Cancelled parses with nulls", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      orderCaseId: "500e1000005esriAAA",
      orderStatus: "Cancelled",
      workOrderId: null,
      appointmentDateTime: null,
      reason: "Cancelled by centre",
    })
    expect(p.orderStatus).toBe("Cancelled")
  })

  it("Rescheduled carries the new case id and new slot", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      orderCaseId: "500e1000005esriAAA",
      orderStatus: "Rescheduled",
      workOrderId: null,
      appointmentDateTime: "2026-09-25 11:30:00",
      reason: "Centre changed slot",
    })
    expect(p.orderCaseId).toBe("500e1000005esriAAA")
    expect(p.appointmentDateTime).toBe("2026-09-25 11:30:00")
  })
})

describe("centre-appointment-booking-status — registrationStatus shape", () => {
  it("Completed retains caseId, registrationStatus and labNumber", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      caseId: "500e1000005esriAAA",
      registrationStatus: "Completed",
      labNumber: "192511200002",
    })
    expect(p.caseId).toBe("500e1000005esriAAA")
    expect(p.registrationStatus).toBe("Completed")
    expect(p.labNumber).toBe("192511200002")
  })

  it("Cancelled (no-show) retains caseId and status", () => {
    const p = centerStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      caseId: "500e1000005esriAAA",
      registrationStatus: "Cancelled",
    })
    expect(p.registrationStatus).toBe("Cancelled")
  })
})

describe("report-status", () => {
  it("Home report keyed by workOrderId", () => {
    const p = reportStatusSchema.parse({
      workOrderId: "0WOe1000000rmGEGAY",
      reportUrl: "https://admin.qa.mycardiogen.com/MyCardioGen_Merged_Lab_Report.pdf",
      reportStatus: "Completed",
      labNumber: "192511200002",
      appointmentId: "08pe1000000FGCXAA4",
      orderNumber: "MCG-75048528-03",
    })
    expect(p.workOrderId).toBe("0WOe1000000rmGEGAY")
  })

  it("Centre report keeps caseId", () => {
    const p = reportStatusSchema.parse({
      orderNumber: "MCG-ADB9F73C-01",
      caseId: "500e1000005esriAAA",
      reportUrl: "https://example.com/report.pdf",
      reportStatus: "Partial",
      labNumber: "192511200002",
    })
    expect(p.caseId).toBe("500e1000005esriAAA")
  })
})

describe("centre status mapping", () => {
  it("orderStatus Completed means the slot was confirmed, not the order finished", () => {
    expect(mapCenterOrderStatus("Completed")).toBe("SCHEDULED")
  })

  it.each([
    ["Cannot Complete", "CANNOT_COMPLETE"],
    ["Cancelled", "CANCELLED"],
    ["Rescheduled", "SCHEDULED"],
  ])("orderStatus %s -> %s", (raw, expected) => {
    expect(mapCenterOrderStatus(raw)).toBe(expected)
  })

  it("registrationStatus Completed means collection under way, report still pending", () => {
    expect(mapCenterRegistrationStatus("Completed")).toBe("IN_PROGRESS")
  })

  it("registrationStatus Cancelled is a no-show, not a deliberate cancellation", () => {
    expect(mapCenterRegistrationStatus("Cancelled")).toBe("CANNOT_COMPLETE")
  })

  it("unknown text leaves the lifecycle untouched", () => {
    expect(mapCenterOrderStatus("Weird")).toBeNull()
    expect(mapCenterRegistrationStatus(undefined)).toBeNull()
  })
})
