import { beforeEach, describe, expect, it, vi } from "vitest"

const findFirst = vi.fn()
const findMany = vi.fn()
const getConsultation = vi.fn()

vi.mock("@/lib/db", () => ({ db: { consultation: { findFirst, findMany } } }))
vi.mock("../consultation", () => ({ getConsultation }))

const { completeConsultationFor } = await import(
  "../../scoring/__tests__/best-answers"
)

const {
  PATIENT_VISIBLE_STATUSES, getConsultationScore, getSelfScore,
  latestScoreSummary, listSelfScores,
} = await import("../consultation-score")

/**
 * A consultation complete enough to clear the patient-portal threshold. Built
 * from the scoring config so it stays valid as sections are activated.
 */
function completeRmo(over: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    createdAt: new Date("2026-09-06T10:12:00Z"),
    status: "SIGNED",
    patient: { sex: "MALE" },
    sections: { personalHistory: completeConsultationFor("MALE") },
    ...over,
  }
}

/** A barely-started intake, well below the completeness threshold. */
function thinRmo(over: Record<string, unknown> = {}) {
  return {
    ...completeRmo(),
    sections: { personalHistory: { personal_history__regularity: "Regular" } },
    ...over,
  }
}

beforeEach(() => {
  findFirst.mockReset()
  findMany.mockReset()
  getConsultation.mockReset()
})

describe("getConsultationScore", () => {
  it("delegates access control and auditing to getConsultation", async () => {
    getConsultation.mockResolvedValue({
      ...completeRmo(), type: "RMO", patientId: "p-1",
      patient: { sex: "FEMALE" },
    })
    const actor = { userId: "u-1", role: "DOCTOR" as never }
    const result = await getConsultationScore("c-1", actor)

    expect(getConsultation).toHaveBeenCalledWith("c-1", actor)
    expect(result.consultationId).toBe("c-1")
    expect(result.totalScore).toBeGreaterThan(0)
  })

  it("refuses to score a MAIN consultation", async () => {
    getConsultation.mockResolvedValue({ ...completeRmo(), type: "MAIN", patientId: "p-1" })
    await expect(
      getConsultationScore("c-1", { userId: "u-1", role: "DOCTOR" as never }),
    ).rejects.toThrow(/RMO consultations only/)
  })
})

describe("getSelfScore — ownership pinning", () => {
  it("puts the session's patientId in the where clause", async () => {
    findFirst.mockResolvedValue(completeRmo())
    await getSelfScore("c-1", "p-session")

    const where = findFirst.mock.calls[0][0].where
    expect(where.patientId).toBe("p-session")
    expect(where.id).toBe("c-1")
    expect(where.type).toBe("RMO")
  })

  it("404s for a consultation belonging to someone else", async () => {
    // The where clause simply matches nothing — there is no branch that could
    // return another patient's row.
    findFirst.mockResolvedValue(null)
    await expect(getSelfScore("c-someone-else", "p-session")).rejects.toThrow(
      /No scored consultation found/,
    )
  })

  it("excludes DRAFT consultations from the portal", async () => {
    findFirst.mockResolvedValue(completeRmo())
    await getSelfScore("c-1", "p-1")
    expect(findFirst.mock.calls[0][0].where.status.in).toEqual([...PATIENT_VISIBLE_STATUSES])
    expect(findFirst.mock.calls[0][0].where.status.in).not.toContain("DRAFT")
  })

  it("withholds a score below the completeness threshold", async () => {
    findFirst.mockResolvedValue(thinRmo())
    await expect(getSelfScore("c-1", "p-1")).rejects.toThrow(/still in progress/)
  })

  it("returns no red flags and no per-question detail", async () => {
    findFirst.mockResolvedValue({
      ...completeRmo(),
      sections: {
        personalHistory: {
          ...completeRmo().sections.personalHistory,
          personal_history__blood_in_stool: "frank blood (painful)",
        },
      },
    })
    const detail = await getSelfScore("c-1", "p-1")
    const json = JSON.stringify(detail)
    expect(json).not.toContain("redFlag")
    expect(json).not.toContain("completeness")
    expect(json).not.toContain("personal_history__")
    expect(Object.keys(detail).sort()).toEqual([
      "consultationDate", "consultationId", "maxScore", "sections", "totalScore",
    ])
  })
})

describe("listSelfScores", () => {
  it("queries only patient-visible statuses, pinned to the session patient", async () => {
    findMany.mockResolvedValue([])
    await listSelfScores("p-session", 5)

    const args = findMany.mock.calls[0][0]
    expect(args.where.patientId).toBe("p-session")
    expect(args.where.status.in).toEqual([...PATIENT_VISIBLE_STATUSES])
    expect(args.take).toBe(5)
    expect(args.orderBy).toEqual({ createdAt: "desc" })
  })

  it("drops consultations below the completeness threshold", async () => {
    findMany.mockResolvedValue([completeRmo({ id: "c-good" }), thinRmo({ id: "c-thin" })])
    const rows = await listSelfScores("p-1")
    expect(rows.map((r) => r.consultationId)).toEqual(["c-good"])
  })

  it("exposes only totals and the delta", async () => {
    findMany.mockResolvedValue([completeRmo()])
    const [row] = await listSelfScores("p-1")
    expect(Object.keys(row).sort()).toEqual([
      "consultationId", "date", "delta", "overallMaxScore", "overallScore",
    ])
  })
})

describe("score history deltas", () => {
  it("is null when the two consultations have different denominators", async () => {
    const fewer = completeConsultationFor("MALE")
    delete fewer["personal_history__libido_level"]
    findMany.mockResolvedValue([
      completeRmo({ id: "c-new" }),
      { ...completeRmo({ id: "c-old" }), sections: { personalHistory: fewer } },
    ])
    const rows = await listSelfScores("p-1")
    expect(rows).toHaveLength(2)
    expect(rows[0].delta).toBeNull()
  })

  it("is a plain difference when the denominators match", async () => {
    const worse = { ...completeConsultationFor("MALE"), personal_history__libido_level: "decreased" }
    findMany.mockResolvedValue([
      completeRmo({ id: "c-new" }),
      { ...completeRmo({ id: "c-old" }), sections: { personalHistory: worse } },
    ])
    const rows = await listSelfScores("p-1")
    expect(rows[0].delta).toBe(5) // normal 10 vs decreased 5
  })
})

describe("latestScoreSummary", () => {
  it("returns null when the patient has no RMO consultation", async () => {
    findMany.mockResolvedValue([])
    expect(await latestScoreSummary("p-1")).toBeNull()
  })

  it("summarises the most recent consultation with a version stamp", async () => {
    findMany.mockResolvedValue([completeRmo()])
    const s = await latestScoreSummary("p-1")
    expect(findMany.mock.calls[0][0].take).toBe(1)
    expect(s).toMatchObject({ overallScore: expect.any(Number), scoringVersion: expect.any(String) })
    // No section detail on a list row — the column shows a total only.
    expect(Object.keys(s!).sort()).toEqual([
      "consultationDate", "overallMaxScore", "overallScore", "scoringVersion",
    ])
  })
})
