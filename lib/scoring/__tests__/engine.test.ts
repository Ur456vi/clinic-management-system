import { describe, expect, it } from "vitest"
import { scoreForAdmin } from "../engine"
import { SCORING_CONFIG } from "../config"
import { scoreSection } from "../section-scorer"
import { bestAnswersFor, reachableMax } from "./best-answers"

const activeSections = SCORING_CONFIG.filter((s) => s.active)
const section = (key: string) => SCORING_CONFIG.find((s) => s.key === key)!

const wrap = (answers: Record<string, string>) => ({ personalHistory: answers })

describe("section scoring", () => {
  it.each(activeSections.map((s) => [s.key, s] as const))(
    "%s: best answers reach the reachable maximum",
    (_key, config) => {
      const result = scoreSection(config, bestAnswersFor(config), {}, "answered")
      expect(result.score).toBe(reachableMax(config))
      expect(result.score).toBe(result.maxScore)
      expect(result.redFlags).toEqual([])
    },
  )

  it.each(activeSections.map((s) => [s.key, s] as const))(
    "%s: an empty consultation scores 0/0 and is fully unanswered",
    (_key, config) => {
      const result = scoreSection(config, {}, {}, "answered")
      expect(result).toMatchObject({ score: 0, maxScore: 0, answered: 0 })
      expect(result.applicable).toBeGreaterThan(0)
    },
  )

  it("keeps an ambiguous blank out of the completeness denominator", () => {
    // The four bare-checkbox bowel symptoms and the 16 parasomnias: a healthy
    // patient ticks nothing, which is stored identically to "never asked".
    // Counting them as unanswered would cap a perfect intake at 72%.
    const bowel = scoreSection(section("bowel"), {}, {}, "answered")
    expect(bowel.applicable).toBe(7)
    expect(bowel.indeterminate).toBe(4)

    const sleep = scoreSection(section("sleep"), {}, {}, "answered")
    expect(sleep.indeterminate).toBe(16)
  })

  it("counts a genuinely skipped choice against completeness", () => {
    const r = scoreSection(section("temperature"), {}, {}, "answered")
    expect(r.applicable).toBe(3)
    expect(r.indeterminate).toBe(0)
  })

  it("charges the denominator for unanswered questions in 'all' mode", () => {
    const bowel = section("bowel")
    expect(scoreSection(bowel, {}, {}, "all").maxScore).toBe(110)
    expect(scoreSection(bowel, {}, {}, "answered").maxScore).toBe(0)
  })
})

describe("applicability", () => {
  const womens = { personal_history__womens_health_pcos: "No" }

  it("scores Women's Health for a female patient", () => {
    const r = scoreForAdmin(wrap(womens), { sex: "FEMALE" })
    expect(r.sections.map((s) => s.key)).toContain("womensHealth")
  })

  it("does not score Women's Health for a male patient with no answers there", () => {
    const r = scoreForAdmin(wrap({}), { sex: "MALE" })
    expect(r.sections.map((s) => s.key)).not.toContain("womensHealth")
  })

  it("includes a gendered section for an OTHER patient when it holds answers", () => {
    const r = scoreForAdmin(wrap(womens), { sex: "OTHER" })
    expect(r.sections.map((s) => s.key)).toContain("womensHealth")
  })

  it("prefers the consultation's own sex over Patient.sex", () => {
    const r = scoreForAdmin(
      { demographics: { demographics__sex: "Female" }, personalHistory: {} },
      { sex: "MALE" },
    )
    expect(r.sections.map((s) => s.key)).toContain("womensHealth")
  })

  it("never scores an inactive section", () => {
    const r = scoreForAdmin(
      wrap({ personal_history__mens_health_morning_erections: "Yes" }),
      { sex: "MALE" },
    )
    const inactive = SCORING_CONFIG.filter((s) => !s.active).map((s) => s.key)
    expect(inactive.length).toBeGreaterThan(0)
    for (const key of inactive) {
      expect(r.sections.map((s) => s.key)).not.toContain(key)
    }
  })
})

describe("aggregation", () => {
  it("the total equals the sum of the sections", () => {
    const r = scoreForAdmin(
      wrap({ personal_history__regularity: "Regular", personal_history__snoring: "none" }),
      { sex: "FEMALE" },
    )
    expect(r.totalScore).toBe(r.sections.reduce((n, s) => n + s.score, 0))
    expect(r.maxScore).toBe(r.sections.reduce((n, s) => n + s.maxScore, 0))
  })

  it("collects red flags with their severity", () => {
    const r = scoreForAdmin(
      wrap({
        personal_history__blood_in_stool: "frank blood (painful)",
        personal_history__tendencies: "suicidal",
        personal_history__snoring: "apneic spells",
      }),
      { sex: "MALE" },
    )
    expect(r.redFlagCount).toBe(3)
    const flags = r.sections.flatMap((s) => s.redFlags)
    expect(flags.filter((f) => f.severity === "high")).toHaveLength(3)
    expect(flags.map((f) => f.label)).toContain("Blood in stool")
  })

  /** Sum of the document totals for the sections that apply to this patient. */
  const declaredTotalFor = (sex: "MALE" | "FEMALE" | null) =>
    SCORING_CONFIG.filter((s) => s.active)
      .filter((s) => (s.appliesWhen ? s.appliesWhen === sex?.toLowerCase() : true))
      .reduce((n, s) => n + s.declaredMax, 0)

  it("reports completeness as answered / applicable", () => {
    const empty = scoreForAdmin(wrap({}), { sex: "MALE" })
    expect(empty.completeness).toBe(0)
    expect(empty.totalScore).toBe(0)

    const partial = scoreForAdmin(wrap({ personal_history__regularity: "Regular" }), { sex: "MALE" })
    expect(partial.completeness).toBeGreaterThan(0)
    expect(partial.completeness).toBeLessThan(1)
  })

  // The fix for the "Bowel 130 / doc says 110" defect: the denominator is the
  // document's own total for every section that applies, whatever was answered.
  it("marks every section out of its declared maximum", () => {
    for (const sex of ["MALE", "FEMALE"] as const) {
      const empty = scoreForAdmin(wrap({}), { sex })
      expect(empty.maxScore).toBe(declaredTotalFor(sex))
      for (const s of empty.sections) {
        expect(s.maxScore).toBe(section(s.key).declaredMax)
      }
    }
    const bowel = scoreForAdmin(wrap({ personal_history__regularity: "Regular" }), { sex: "MALE" })
      .sections.find((s) => s.key === "bowel")!
    expect(bowel).toMatchObject({ score: 10, maxScore: 110 })
  })

  it("survives a malformed sections blob instead of throwing", () => {
    for (const blob of [null, undefined, {}, [], "nonsense", { personalHistory: null }]) {
      expect(() => scoreForAdmin(blob, { sex: null })).not.toThrow()
    }
    // No sex, so neither gendered section applies — but the ungendered ones
    // still carry their document totals.
    expect(scoreForAdmin(null, { sex: null })).toMatchObject({
      totalScore: 0,
      maxScore: declaredTotalFor(null),
    })
  })

  it("ignores non-string values in the stored blob", () => {
    const r = scoreForAdmin(
      { personalHistory: { personal_history__regularity: 42, personal_history__snoring: "none" } },
      { sex: "MALE" },
    )
    expect(r.totalScore).toBe(10)
  })

  it("reads a field by name regardless of which section key it sits under", () => {
    // Some fields registered under examination_summary still carry a
    // personal_history__ name prefix, so the section key cannot be trusted.
    const r = scoreForAdmin(
      { examinationSummary: { personal_history__regularity: "Regular" } },
      { sex: "MALE" },
    )
    expect(r.totalScore).toBe(10)
  })
})

describe("a known sex decides on its own (B-21 guard)", () => {
  // The consultation form renders both gendered accordions to everyone, so an
  // RMO working top to bottom fills the one that does not apply. Honouring that
  // data marked a female patient out of 1,820 instead of 1,630.
  const mensAnswers = {
    personal_history__mens_health_morning_erections: "Yes",
    personal_history__mens_health_urinary_symptoms: "No",
  }
  const mensScores = { personal_history__mens_health_morning_erections: 10 }

  it("ignores Men's Health answers on a female patient", () => {
    const r = scoreForAdmin(
      { personalHistory: mensAnswers, scores: mensScores },
      { sex: "FEMALE" },
    )
    expect(r.sections.map((s) => s.key)).not.toContain("mensHealth")
    expect(r.sections.map((s) => s.key)).toContain("womensHealth")
  })

  it("ignores Women's Health answers on a male patient", () => {
    const r = scoreForAdmin(
      { personalHistory: { personal_history__womens_health_pcos: "No" } },
      { sex: "MALE" },
    )
    expect(r.sections.map((s) => s.key)).not.toContain("womensHealth")
  })

  it("still lets stored data decide when sex is OTHER", () => {
    const r = scoreForAdmin({ personalHistory: mensAnswers }, { sex: "OTHER" })
    expect(r.sections.map((s) => s.key)).toContain("mensHealth")
  })
})
