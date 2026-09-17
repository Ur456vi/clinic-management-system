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

describe("manual scoring reaches the items the form cannot derive", () => {
  it("scores a GPE finding by hand, out of the document's 600", () => {
    const scored = scoreForAdmin(
      wrap({}, { personal_history__gpe_pallor: 10, personal_history__gpe_icterus: 5 }),
      { sex: "MALE" },
    )
    const gpe = scored.sections.find((s) => s.key === "gpe")
    expect(gpe).toMatchObject({ score: 15, maxScore: 600, answered: 2, manual: 2 })
  })

  it("scores the blocks whose controls cannot express them — facies, gait", () => {
    const scored = scoreForAdmin(
      wrap({}, {
        personal_history__gpe_facies: 130,
        personal_history__gpe_gait_abnormal_pattern: 100,
      }),
      { sex: "MALE" },
    )
    expect(scored.sections.find((s) => s.key === "gpe")?.score).toBe(230)
  })

  it("scores Energy out of 50, the document's one non-10 item", () => {
    const scored = scoreForAdmin(
      wrap({}, { personal_history__energy_pattern: 40 }), { sex: "MALE" },
    )
    expect(scored.sections.find((s) => s.key === "energy")).toMatchObject({
      score: 40, maxScore: 50, manual: 1,
    })
  })

  // F-3: the document gives PSS-10 no point values, no reverse-scored items and
  // no total, so there is nothing to score it out of. Its ten answers are still
  // collected, and the section is still listed in the diagnostics panel.
  it("still refuses to score PSS-10, which the document never defined", () => {
    const scored = scoreForAdmin(
      wrap({}, { personal_history__pss10_q1: 8, personal_history__pss10_q2: 6 }),
      { sex: "MALE" },
    )
    expect(scored.sections.map((s) => s.key)).not.toContain("stress")
    expect(readManualScores(wrap({}, { personal_history__pss10_q1: 8 }))).toEqual({})
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

  it("adds manual scores into the total without moving the denominator", () => {
    const before = scoreForAdmin(wrap({ personal_history__regularity: "Regular" }), { sex: "MALE" })
    const after = scoreForAdmin(
      wrap({ personal_history__regularity: "Regular" }, { personal_history__gpe_pallor: 10 }),
      { sex: "MALE" },
    )
    expect(after.totalScore).toBe(before.totalScore + 10)
    // The denominator is the document's, so hand-scoring cannot inflate it.
    expect(after.maxScore).toBe(before.maxScore)
  })
})

describe("scorable field set", () => {
  const scorable = RMO_FIELDS.filter((f) => isScorableField(f.n))

  it("offers a score box only for fields in a scored section", () => {
    for (const f of scorable) expect(FIELD_SECTION.has(f.n)).toBe(true)
  })

  it("never offers one for a Note or a _specify helper", () => {
    for (const f of scorable) {
      expect(f.l).not.toBe("Note")
      expect(f.n).not.toMatch(/_note$|_specify$/)
    }
  })

  /**
   * The defect this whole change exists to stop: a field with a score box but
   * no rule used to add a phantom 10 to its section, which is why Bowel read
   * 130 against a documented 110. Scorable and scored must be the same set.
   */
  it("offers a score box for exactly the fields a rule scores", () => {
    const ruled = new Set(SCORING_CONFIG.flatMap((s) => s.rules.map((r) => r.field)))
    const boxed = new Set(scorable.map((f) => f.n))
    expect([...boxed].filter((f) => !ruled.has(f))).toEqual([])
    // Every rule must also point at a field the form actually renders.
    const registry = new Set(RMO_FIELDS.map((f) => f.n))
    expect([...ruled].filter((f) => !registry.has(f))).toEqual([])
  })

  it("covers the items the engine cannot derive", () => {
    const bySection = new Map<string, number>()
    for (const f of scorable) {
      const k = FIELD_SECTION.get(f.n)!
      bySection.set(k, (bySection.get(k) ?? 0) + 1)
    }
    for (const key of ["gpe", "mensHealth", "energy", "hygiene", "misc"]) {
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
