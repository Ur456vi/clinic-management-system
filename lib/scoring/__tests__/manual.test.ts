import { describe, expect, it } from "vitest"
import { RMO_FIELDS } from "@/lib/rmo-fields"
import { scoreForAdmin, scoreForPatient } from "../engine"
import { SCORING_CONFIG } from "../config"
import { FIELD_SECTION, isScorableField, readManualScores } from "../manual"
import { scoreSection } from "../section-scorer"

const section = (key: string) => SCORING_CONFIG.find((s) => s.key === key)!

const wrap = (answers: Record<string, string>, scores?: Record<string, unknown>) => ({
  personalHistory: answers,
  ...(scores ? { scores } : {}),
})

describe("readManualScores", () => {
  it("keeps well-formed scores for known fields", () => {
    expect(readManualScores(wrap({}, { personal_history__regularity: 7 }))).toEqual({
      personal_history__regularity: 7,
    })
  })

  it("coerces a numeric string, because form inputs arrive as text", () => {
    expect(readManualScores(wrap({}, { personal_history__regularity: "7" }))).toEqual({
      personal_history__regularity: 7,
    })
  })

  // Dropped rather than clamped: a nonsense value is a bug or a bad edit, and
  // turning it into a plausible score would hide that.
  it.each([["-1"], ["abc"], ["101"], [""], ["   "], [null], [{}]])(
    "drops the unusable value %p",
    (bad) => {
      expect(readManualScores(wrap({}, { personal_history__regularity: bad }))).toEqual({})
    },
  )

  // A blank box means "no override, use the derived score". A deliberate 0
  // means "this question scores nothing". They must not collapse together.
  it("keeps a deliberate zero but drops a blank", () => {
    expect(readManualScores(wrap({}, { personal_history__regularity: 0 }))).toEqual({
      personal_history__regularity: 0,
    })
    expect(readManualScores(wrap({}, { personal_history__regularity: "0" }))).toEqual({
      personal_history__regularity: 0,
    })
    expect(readManualScores(wrap({}, { personal_history__regularity: "" }))).toEqual({})
  })

  it("drops a score for a field that belongs to no scored section", () => {
    expect(readManualScores(wrap({}, { social_history__marital_status: 10 }))).toEqual({})
  })

  it("survives a malformed blob", () => {
    for (const blob of [null, undefined, {}, { scores: null }, { scores: "x" }, { scores: [] }]) {
      expect(() => readManualScores(blob)).not.toThrow()
    }
  })
})

describe("manual override", () => {
  it("beats the derived score for the same question", () => {
    const answers = { personal_history__regularity: "Regular" } // derives 10
    const derived = scoreSection(section("bowel"), answers, {}, "answered")
    expect(derived.score).toBe(10)

    const overridden = scoreSection(
      section("bowel"), answers, { personal_history__regularity: 4 }, "answered",
    )
    expect(overridden.score).toBe(4)
    expect(overridden.manual).toBe(1)
  })

  it("counts as answered even when the question itself is blank", () => {
    // The RMO judged it; that is the point of the override.
    const r = scoreSection(section("bowel"), {}, { personal_history__regularity: 6 }, "answered")
    expect(r).toMatchObject({ score: 6, maxScore: 10, answered: 1, manual: 1 })
  })

  it("clamps to the rule's own maximum", () => {
    const r = scoreSection(section("bowel"), {}, { personal_history__regularity: 99 }, "answered")
    expect(r.score).toBe(10)
  })
})

describe("manual scoring unblocks the sections that cannot be derived", () => {
  it("activates GPE, which has no rules at all", () => {
    const plain = scoreForAdmin(wrap({}), { sex: "MALE" })
    expect(plain.sections.map((s) => s.key)).not.toContain("gpe")

    const scored = scoreForAdmin(
      wrap({}, { personal_history__gpe_pallor: 10, personal_history__gpe_icterus: 5 }),
      { sex: "MALE" },
    )
    const gpe = scored.sections.find((s) => s.key === "gpe")
    expect(gpe).toMatchObject({ score: 15, maxScore: 20, answered: 2, manual: 2 })
  })

  it("activates PSS-10, whose point values the document never defined", () => {
    const scored = scoreForAdmin(
      wrap({}, { personal_history__pss10_q1: 8, personal_history__pss10_q2: 6 }),
      { sex: "MALE" },
    )
    expect(scored.sections.find((s) => s.key === "stress")).toMatchObject({
      score: 14, maxScore: 20, manual: 2,
    })
  })

  it("routes each manual score to the section its field belongs to", () => {
    const scored = scoreForAdmin(
      wrap({}, {
        personal_history__gpe_pallor: 10,
        personal_history__mens_health_morning_erections: 5,
      }),
      { sex: "MALE" },
    )
    expect(scored.sections.find((s) => s.key === "gpe")?.score).toBe(10)
    expect(scored.sections.find((s) => s.key === "mensHealth")?.score).toBe(5)
  })

  it("adds manual scores into the overall total", () => {
    const before = scoreForAdmin(wrap({ personal_history__regularity: "Regular" }), { sex: "MALE" })
    const after = scoreForAdmin(
      wrap({ personal_history__regularity: "Regular" }, { personal_history__gpe_pallor: 10 }),
      { sex: "MALE" },
    )
    expect(after.totalScore).toBe(before.totalScore + 10)
    expect(after.maxScore).toBe(before.maxScore + 10)
  })
})

describe("scorable field set", () => {
  const scorable = RMO_FIELDS.filter((f) => isScorableField(f.n, f.l))

  it("offers a score box only for fields in a scored section", () => {
    for (const f of scorable) expect(FIELD_SECTION.has(f.n)).toBe(true)
  })

  it("never offers one for a Note or a _specify helper", () => {
    for (const f of scorable) {
      expect(f.l).not.toBe("Note")
      expect(f.n).not.toMatch(/_note$|_specify$/)
    }
  })

  it("covers the sections the engine cannot derive", () => {
    const bySection = new Map<string, number>()
    for (const f of scorable) {
      const k = FIELD_SECTION.get(f.n)!
      bySection.set(k, (bySection.get(k) ?? 0) + 1)
    }
    for (const key of ["gpe", "mensHealth", "stress", "energy"]) {
      expect(bySection.get(key) ?? 0).toBeGreaterThan(0)
    }
  })
})

describe("the patient still sees no per-question detail", () => {
  it("manual scores do not leak field names or points into the portal payload", () => {
    const json = JSON.stringify(
      scoreForPatient(
        wrap({ personal_history__regularity: "Regular" }, { personal_history__gpe_pallor: 10 }),
        { sex: "MALE" },
      ),
    )
    expect(json).not.toContain("personal_history__")
    expect(json).not.toContain("manual")
    expect(json).not.toContain("points")
  })
})
