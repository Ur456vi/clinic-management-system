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

import { buildCenterPayload, buildHomePayload } from "../orders"

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
  const p = buildHomePayload({ order, patient, input: input("HOME"), items })

  it("sends customer.source (absent source 500s on MI)", () => {
    expect(p.customer.source).toBe("MyCardioGen")
  })

  it("converts the UTC slot to IST wall-clock for the partner", () => {
    expect(p.appointment.startTime).toBe("2026-09-15 06:00:00")
    expect(p.appointment.endTime).toBe("2026-09-15 06:45:00")
  })
})

describe("buildCenterPayload", () => {
  const p = buildCenterPayload({ order, patient, input: input("CENTER"), items })

  it("sends the registered panel name, not our clinic name", () => {
    expect(p.customer.source).toBe("MyCardioGen")
    expect(p.customer.source).not.toBe("Vyara Clinic")
  })

  it("converts the UTC slot to IST wall-clock for the partner", () => {
    expect(p.customer.startTime).toBe("2026-09-15 06:00:00")
  })
})
