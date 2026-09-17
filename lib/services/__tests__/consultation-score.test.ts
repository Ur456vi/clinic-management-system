import { beforeEach, describe, expect, it, vi } from "vitest"

const findFirst = vi.fn()
const findMany = vi.fn()
const getConsultation = vi.fn()

vi.mock("@/lib/db", () => ({ db: { consultation: { findFirst, findMany } } }))
vi.mock("../consultation", () => ({ getConsultation }))

const { completeConsultationFor, completeManualScoresFor } = await import(
  "../../scoring/__tests__/best-answers"
)

const {
  PATIENT_VISIBLE_STATUSES, getConsultationScore, getSelfScore,
  latestScoreSummary, listSelfScores,
} = await import("../consultation-score")

/**
 * A consultation complete enough to clear the patient-portal threshold. Built
 * from the scoring config so it stays valid as sections are activated.
 *
 * Both halves are required: the answers the engine derives, and the hand scores
 * for the document items the form cannot express.
 */
function completeRmo(over: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    createdAt: new Date("2026-09-06T10:12:00Z"),
    status: "SIGNED",
    patient: { sex: "MALE" },
    sections: {
      personalHistory: completeConsultationFor("MALE"),
      scores: completeManualScoresFor("MALE"),
    },
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

  // The portal mirrors whatever the RMO has saved, DRAFT included: nothing in
  // the RMO's own screen ever leaves DRAFT, so excluding it withheld the score
  // indefinitely rather than briefly. The completeness caption carries the
  // caveat the status used to.
  it("reads every consultation status, DRAFT included", async () => {
    findFirst.mockResolvedValue(completeRmo())
    await getSelfScore("c-1", "p-1")
    expect(findFirst.mock.calls[0][0].where.status.in).toEqual([...PATIENT_VISIBLE_STATUSES])
    expect(findFirst.mock.calls[0][0].where.status.in).toContain("DRAFT")
  })

  // The portal shows a partial assessment rather than hiding it, and leans on
  // the completeness figure to caption it. Withholding was worse: the patient
  // saw nothing at all and had no way to tell "not assessed" from "broken".
  it("returns a thin assessment, carrying its low completeness", async () => {
    findFirst.mockResolvedValue(thinRmo())
    const detail = await getSelfScore("c-1", "p-1")
    expect(detail.completeness).toBeLessThan(0.8)
    expect(detail.totalScore).toBeGreaterThanOrEqual(0)
  })

  it("returns no red flags and no per-question detail", async () => {
    findFirst.mockResolvedValue({
      ...completeRmo(),
      sections: {
        personalHistory: {
          ...completeRmo().sections.personalHistory,
          personal_history__blood_in_stool: "frank blood (painful)",
        },
        scores: completeManualScoresFor("MALE"),
      },
    })
    const detail = await getSelfScore("c-1", "p-1")
    const json = JSON.stringify(detail)
    expect(json).not.toContain("redFlag")
    expect(json).not.toContain("personal_history__")
    // `completeness` is present by design; nothing else diagnostic is.
    expect(Object.keys(detail).sort()).toEqual([
      "completeness", "consultationDate", "consultationId", "maxScore",
      "sections", "totalScore",
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

  it("keeps a thin consultation, tagged with its completeness", async () => {
    findMany.mockResolvedValue([completeRmo({ id: "c-good" }), thinRmo({ id: "c-thin" })])
    const rows = await listSelfScores("p-1")
    expect(rows.map((r) => r.consultationId)).toEqual(["c-good", "c-thin"])
    expect(rows[1].completeness).toBeLessThan(0.8)
  })

  it("exposes only totals, the delta, and completeness", async () => {
    findMany.mockResolvedValue([completeRmo()])
    const [row] = await listSelfScores("p-1")
    expect(Object.keys(row).sort()).toEqual([
      "completeness", "consultationId", "date", "delta", "overallMaxScore",
      "overallScore",
    ])
  })

  // The history list mirrors the same statuses as the detail read — a score
  // that shows on the dashboard must not vanish from the history beneath it.
  it("lists every consultation status, DRAFT included", async () => {
    findMany.mockResolvedValue([])
    await listSelfScores("p-1")
    expect(findMany.mock.calls[0][0].where.status.in).toContain("DRAFT")
    expect(findMany.mock.calls[0][0].where.status.in).toEqual([...PATIENT_VISIBLE_STATUSES])
  })

  /**
   * Ownership is the guarantee that survives every relaxation above. Widening
   * which STATUSES a patient sees must never widen WHOSE consultations they
   * see: `patientId` comes from the session and is always in the where clause.
   */
  it("stays pinned to the session patient no matter the status", async () => {
    findMany.mockResolvedValue([])
    await listSelfScores("p-session")
    expect(findMany.mock.calls[0][0].where.patientId).toBe("p-session")
    expect(findMany.mock.calls[0][0].where.type).toBe("RMO")
  })
})

describe("score history deltas", () => {
  // Since every section is marked out of the document's own total, the
  // denominator only moves when a different SET of sections applies — which is
  // what makes a male and a female consultation incomparable (1810 vs 1790).
  it("is null when the two consultations have different denominators", async () => {
    findMany.mockResolvedValue([
      completeRmo({ id: "c-new" }),
      {
        ...completeRmo({ id: "c-old" }),
        patient: { sex: "FEMALE" },
        sections: {
          personalHistory: completeConsultationFor("FEMALE"),
          scores: completeManualScoresFor("FEMALE"),
        },
      },
    ])
    const rows = await listSelfScores("p-1")
    expect(rows).toHaveLength(2)
    expect(rows[0].overallMaxScore).not.toBe(rows[1].overallMaxScore)
    expect(rows[0].delta).toBeNull()
  })

  it("is a plain difference when the denominators match", async () => {
    const worse = { ...completeConsultationFor("MALE"), personal_history__libido_level: "decreased" }
    findMany.mockResolvedValue([
      completeRmo({ id: "c-new" }),
      {
        ...completeRmo({ id: "c-old" }),
        sections: { personalHistory: worse, scores: completeManualScoresFor("MALE") },
      },
    ])
    const rows = await listSelfScores("p-1")
    expect(rows[0].overallMaxScore).toBe(rows[1].overallMaxScore)
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
