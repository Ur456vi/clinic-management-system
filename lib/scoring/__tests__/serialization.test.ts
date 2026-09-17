import { describe, expect, it } from "vitest"
import { scoreForAdmin, scoreForPatient } from "../engine"

/**
 * The brief's hardest rule: score per question internally, expose per section
 * only. Nothing may leak a question's own point value onto any surface —
 * including the patient portal, the admin UI, and the JSON either one receives.
 *
 * These are cheap tests guarding the requirement most likely to regress the
 * moment someone adds a debug field to the result type.
 */

const CONSULTATION = {
  personalHistory: {
    personal_history__regularity: "Regular",
    personal_history__blood_in_stool: "frank blood (painful)",
    personal_history__tendencies: "suicidal",
    personal_history__snoring: "apneic spells",
    personal_history__womens_health_pcos: "Yes",
    personal_history__parasomnias_select_all_that_apply: "Nightmares, Night Sweats",
  },
}

const patientResult = scoreForPatient(CONSULTATION, { sex: "FEMALE" })
const adminResult = scoreForAdmin(CONSULTATION, { sex: "FEMALE" })

describe("patient payload", () => {
  const json = JSON.stringify(patientResult)

  it("carries only section totals", () => {
    for (const section of patientResult.sections) {
      expect(Object.keys(section).sort()).toEqual(["key", "maxScore", "name", "score"])
    }
  })

  it("hides red flags entirely", () => {
    expect(json).not.toContain("redFlag")
    expect(json).not.toContain("severity")
    // and does not leak a flagged answer's own label either
    expect(json).not.toContain("Blood in stool")
    expect(json).not.toContain("Tendencies")
  })

  it("exposes no per-question detail", () => {
    expect(json).not.toContain("points")
    expect(json).not.toContain("personal_history__")
    expect(json).not.toContain("field")
    expect(json).not.toContain("confirmed")
  })

  it("hides the scoring version and the per-section counts", () => {
    expect(json).not.toContain("scoringVersion")
    expect(json).not.toContain("answered")
    expect(json).not.toContain("applicable")
    expect(json).not.toContain("indeterminate")
  })

  /**
   * The one diagnostic that crosses over, and only because the portal now shows
   * partial assessments instead of withholding them: without it a 25% score
   * drawn from a third of the questions reads as a health verdict. It is a
   * single top-level fraction — not a per-section breakdown.
   */
  it("carries overall completeness, so a partial score can be captioned", () => {
    expect(patientResult.completeness).toBeGreaterThanOrEqual(0)
    expect(patientResult.completeness).toBeLessThanOrEqual(1)
    for (const section of patientResult.sections) {
      expect(Object.keys(section).sort()).toEqual(["key", "maxScore", "name", "score"])
    }
  })
})

describe("admin payload", () => {
  const json = JSON.stringify(adminResult)

  it("shows red flags, because the clinician needs them", () => {
    expect(adminResult.redFlagCount).toBeGreaterThan(0)
    expect(json).toContain("Blood in stool")
  })

  it("still exposes no per-question points", () => {
    expect(json).not.toContain('"points"')
    for (const section of adminResult.sections) {
      expect(Object.keys(section).sort()).toEqual([
        "answered", "applicable", "indeterminate", "key", "manual", "maxScore",
        "name", "redFlags", "score", "unconfirmed",
      ])
    }
  })

  it("names a red flag's field for drill-down but never its stored answer", () => {
    expect(json).not.toContain("frank blood (painful)")
    expect(json).not.toContain("suicidal")
  })
})

describe("both payloads", () => {
  it("agree on the totals", () => {
    expect(patientResult.totalScore).toBe(adminResult.totalScore)
    expect(patientResult.maxScore).toBe(adminResult.maxScore)
    expect(patientResult.sections).toHaveLength(adminResult.sections.length)
  })

  it("never render a negative total", () => {
    expect(adminResult.totalScore).toBeGreaterThanOrEqual(0)
    expect(patientResult.totalScore).toBeGreaterThanOrEqual(0)
  })
})
