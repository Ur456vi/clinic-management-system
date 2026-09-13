/**
 * A prescribed test must reach the patient by exactly ONE pathway.
 *
 * Tests the partner lab fulfils travel as a LabOrder and get their report from
 * the partner. Everything else becomes a LabResult row and is reported by staff
 * upload. Materializing both for the same test leaves a duplicate sitting
 * Active forever, because the partner's report never lands on the LabResult.
 */

import { describe, expect, it } from "vitest"

import { materializeLabOrdersFromConsultation } from "../lab-result"

/** Minimal stand-in for a Prisma transaction client. */
function fakeTx(opts: { mappings?: { testKey: string; labTestId: string; labTestName: string }[]; throwOnMapping?: boolean }) {
  const created: Record<string, unknown>[] = []
  return {
    created,
    tx: {
      labTestMapping: {
        findMany: async () => {
          if (opts.throwOnMapping) throw new Error("mapping lookup exploded")
          return opts.mappings ?? []
        },
      },
      labProduct: { findMany: async () => [] },
      labResult: {
        findMany: async () => [],
        createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
          created.push(...data)
          return { count: data.length }
        },
      },
    } as never,
  }
}

const ROUTINE = "routine::CBC with ESR with PERIPHERAL SMEAR with RETICULOCYTE COUNT"
const HORMONAL = "male-hormonal::TESTOSTERONE (TOTAL & FREE)"

function sections(keys: string[]) {
  return { test: { test__selected_tests: JSON.stringify(keys) } } as never
}

const base = {
  consultationId: "c1",
  patientId: "p1",
  orderedAt: new Date("2026-09-14T00:00:00Z"),
  orderingDoctorId: null,
}

describe("materializeLabOrdersFromConsultation — partner split", () => {
  it("skips a test the partner will fulfil", async () => {
    const f = fakeTx({
      mappings: [{ testKey: ROUTINE, labTestId: "LSHHI34491", labTestName: "MYCARDIOGEN PHASE 1 BLOOD" }],
    })
    const n = await materializeLabOrdersFromConsultation(f.tx, { ...base, sections: sections([ROUTINE]) })
    expect(n).toBe(0)
    expect(f.created).toHaveLength(0)
  })

  it("still creates rows for tests the partner cannot fulfil", async () => {
    const f = fakeTx({ mappings: [] })
    const n = await materializeLabOrdersFromConsultation(f.tx, { ...base, sections: sections([HORMONAL]) })
    expect(n).toBe(1)
  })

  it("splits a mixed basket, keeping only the unmapped side", async () => {
    const f = fakeTx({
      mappings: [{ testKey: ROUTINE, labTestId: "LSHHI34491", labTestName: "MYCARDIOGEN PHASE 1 BLOOD" }],
    })
    const n = await materializeLabOrdersFromConsultation(f.tx, {
      ...base,
      sections: sections([ROUTINE, HORMONAL]),
    })
    expect(n).toBe(1)
    expect(JSON.stringify(f.created)).not.toContain("ROUTINE INVESTIGATIONS")
  })

  it("fails OPEN — a mapping lookup error must not drop a prescribed test", async () => {
    const f = fakeTx({ throwOnMapping: true })
    const n = await materializeLabOrdersFromConsultation(f.tx, {
      ...base,
      sections: sections([ROUTINE, HORMONAL]),
    })
    expect(n).toBe(2)
  })
})
