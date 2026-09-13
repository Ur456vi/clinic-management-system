/**
 * Booking payload regression tests.
 *
 * `customer.source` is the partner-assigned panel name. MI resolves it against
 * a Panel record with no empty-list guard, so omitting it (the old HOME bug) or
 * sending our clinic name instead of the registered panel (the old CENTER bug)
 * fails the booking with a 500 "List has no rows for assignment to SObject".
 * Both were verified live against MI UAT.
 */

import { describe, expect, it } from "vitest"

import { env } from "@/lib/env"

import { buildCenterPayload, buildHomePayload, findUnmappedItems } from "../orders"

import type { BookInput } from "../orders"
import type { ResolvedItem } from "../mapping"

const items: ResolvedItem[] = [
  {
    testKey: "mcg::phase1",
    testName: "Phase 1 Blood",
    labTestId: "LSHHI34491",
    labTestName: "MYCARDIOGEN PHASE 1 BLOOD",
    source: "mapping",
  },
]

const patient = {
  id: "p1",
  patientNumber: "PAT-0001",
  fullName: "Asha Raman",
  email: "asha@example.com",
  phone: "9999473969",
  dateOfBirth: new Date("1990-05-12T00:00:00Z"),
  sex: "FEMALE",
  address: "12 MG Road",
  placeOfResidence: null,
}

const order = { orderNumber: "IPHMH-LAB-2627-0001", centerCode: "CEN-101" } as never

/**
 * The partner panel name now arrives as an argument rather than a module-scope
 * constant, because it resolves from admin settings at request time. The
 * builders stay synchronous, which is what keeps them testable like this.
 */
const SOURCE = "MyCardioGen"

function input(mode: "HOME" | "CENTER"): BookInput {
  return {
    collectionMode: mode,
    centerCode: "CEN-101",
    // getAvailableSlots returns UTC; the booking endpoints read IST wall-clock.
    slot: {
      startTime: "2026-09-15T00:30:00Z",
      endTime: "2026-09-15T01:15:00Z",
      serviceTerritoryId: "0Hhe10000000G1aCAE",
    },
    bookedVia: "RECEPTION" as never,
  }
}

describe("buildHomePayload", () => {
  const p = buildHomePayload({ order, patient, input: input("HOME"), items, source: SOURCE })

  it("sends customer.source (absent source 500s on MI)", () => {
    expect(p.customer.source).toBe("MyCardioGen")
  })

  it("converts the UTC slot to IST wall-clock for the partner", () => {
    expect(p.appointment.startTime).toBe("2026-09-15 06:00:00")
    expect(p.appointment.endTime).toBe("2026-09-15 06:45:00")
  })
})

describe("buildCenterPayload", () => {
  const p = buildCenterPayload({ order, patient, input: input("CENTER"), items, source: SOURCE })

  it("sends the registered panel name, not our clinic name", () => {
    expect(p.customer.source).toBe("MyCardioGen")
    expect(p.customer.source).not.toBe("Vyara Clinic")
  })

  it("converts the UTC slot to IST wall-clock for the partner", () => {
    expect(p.customer.startTime).toBe("2026-09-15 06:00:00")
  })
})

describe("partner product catalogue", () => {
  /**
   * `getAllProducts` returns 200 and looks healthy, but it is another partner's
   * catalogue (five Bajaj corporate packages) containing none of our items.
   * Only the panel-filtered endpoint returns ours.
   */
  it("falls back to the panel-filtered endpoint, never the bare one", () => {
    // env is now the fallback layer beneath admin settings rather than the
    // only source, but a deployment with no settings row still resolves to
    // this, so the default must stay correct.
    expect(env.LAB_PRODUCTS_PATH).toBe("/services/apexrest/GetAllPartnerProductsAPI")
    expect(env.LAB_PRODUCTS_PATH).not.toContain("getAllProducts")
  })
})

describe("findUnmappedItems", () => {
  const mapped: ResolvedItem = {
    testKey: "mcg::phase1",
    testName: "Phase 1 Blood",
    labTestId: "LSHHI34491",
    labTestName: "MYCARDIOGEN PHASE 1 BLOOD",
    source: "mapping",
  }
  const unmapped: ResolvedItem = {
    testKey: "mcg::lft",
    testName: "Liver Function Test",
    labTestId: null,
    labTestName: null,
    source: "unmapped",
  }

  it("flags tests with no partner code", () => {
    expect(findUnmappedItems([mapped, unmapped])).toEqual([unmapped])
  })

  it("passes a fully mapped basket", () => {
    expect(findUnmappedItems([mapped])).toEqual([])
  })
})
