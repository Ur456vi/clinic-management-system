import { describe, expect, it } from "vitest"
import { RMO_FIELDS } from "@/lib/rmo-fields"
import { SCORING_CONFIG } from "../config"
import {
  DYNAMIC_NAME_FIELDS, DYNAMIC_OPTION_FIELDS, KEYS_NOT_IN_FORM, formOptionValues,
} from "./form-options"

const registry = new Set(RMO_FIELDS.map((f) => f.n))
const allRules = SCORING_CONFIG.flatMap((s) => s.rules.map((r) => ({ section: s.key, rule: r })))

describe("config integrity", () => {
  it("every scored field exists in the RMO registry", () => {
    const missing = allRules
      .filter(({ rule }) => !registry.has(rule.field))
      .map(({ section, rule }) => `${section}: ${rule.field}`)
    expect(missing).toEqual([])
  })

  it("no field is scored by two sections", () => {
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const { section, rule } of allRules) {
      const prev = seen.get(rule.field)
      if (prev) dupes.push(`${rule.field}: ${prev} + ${section}`)
      else seen.set(rule.field, section)
    }
    expect(dupes).toEqual([])
  })

  it("sections marked reconciles:true sum to their declared max", () => {
    const bad = SCORING_CONFIG.filter((s) => s.reconciles).map((s) => ({
      key: s.key,
      declaredMax: s.declaredMax,
      ruleMax: s.rules.reduce((n, r) => n + r.max, 0),
    })).filter((s) => s.declaredMax !== s.ruleMax)
    expect(bad).toEqual([])
  })

  it("sections marked reconciles:false explain why", () => {
    const unexplained = SCORING_CONFIG.filter((s) => !s.reconciles && !s.note).map((s) => s.key)
    expect(unexplained).toEqual([])
  })

  it("inactive sections carry no rules, so they cannot leak into a score", () => {
    const leaky = SCORING_CONFIG.filter((s) => !s.active && s.rules.length > 0).map((s) => s.key)
    expect(leaky).toEqual([])
  })

  // The test that would have caught B-1 and B-2.
  it("every choice map key is a value the form can actually store", () => {
    const options = formOptionValues()
    const unmatched: string[] = []
    for (const { section, rule } of allRules) {
      if (rule.kind !== "choice" || !rule.map) continue
      if (DYNAMIC_NAME_FIELDS.has(rule.field) || DYNAMIC_OPTION_FIELDS.has(rule.field)) continue
      const real = options.get(rule.field)
      if (!real) { unmatched.push(`${section}: ${rule.field} has no control in the form`); continue }
      const allowed = KEYS_NOT_IN_FORM[rule.field] ?? {}
      for (const key of Object.keys(rule.map)) {
        if (real.has(key) || key in allowed) continue
        unmatched.push(`${section}: ${rule.field} maps "${key}", form offers ${JSON.stringify([...real])}`)
      }
    }
    expect(unmatched).toEqual([])
  })

  // The allowlist is a pressure valve, so keep pressure on it: every entry must
  // name a real field, a key that rule actually maps, and a reason.
  it("every allowlisted map key is still needed and still explained", () => {
    const options = formOptionValues()
    const stale: string[] = []
    for (const [field, keys] of Object.entries(KEYS_NOT_IN_FORM)) {
      const rule = allRules.find((r) => r.rule.field === field)?.rule
      if (!rule) { stale.push(`${field}: allowlisted but no rule scores it`); continue }
      for (const [key, reason] of Object.entries(keys)) {
        if (!reason.trim()) stale.push(`${field}: "${key}" has no reason`)
        if (!rule.map || !(key in rule.map)) stale.push(`${field}: "${key}" is not in the rule's map`)
        if (options.get(field)?.has(key)) stale.push(`${field}: "${key}" is in the form now — drop the entry`)
      }
    }
    expect(stale).toEqual([])
  })

  it("every form option a choice rule can receive is mapped or covered by a fallback", () => {
    const options = formOptionValues()
    const gaps: string[] = []
    for (const { section, rule } of allRules) {
      if (rule.kind !== "choice" || !rule.map) continue
      if (rule.fallback !== undefined) continue
      if (DYNAMIC_NAME_FIELDS.has(rule.field) || DYNAMIC_OPTION_FIELDS.has(rule.field)) continue
      const real = options.get(rule.field)
      if (!real) continue
      for (const value of real) {
        if (!(value in rule.map)) {
          gaps.push(`${section}: ${rule.field} cannot score "${value}" (no map entry, no fallback)`)
        }
      }
    }
    expect(gaps).toEqual([])
  })

  it("multiSelect options match the form, and max equals options x absentPoints", () => {
    const bad: string[] = []
    for (const { section, rule } of allRules) {
      if (rule.kind !== "multiSelect") continue
      const n = rule.options?.length ?? 0
      if (n === 0) bad.push(`${section}: ${rule.field} has no options`)
      if (rule.items !== n) bad.push(`${section}: ${rule.field} items=${rule.items} but ${n} options`)
      const expected = n * (rule.absentPoints ?? 0)
      if (rule.max !== expected) bad.push(`${section}: ${rule.field} max=${rule.max}, expected ${expected}`)
    }
    expect(bad).toEqual([])
  })

  it("no rule can score above its own max", () => {
    const bad: string[] = []
    for (const { section, rule } of allRules) {
      const values = [
        ...Object.values(rule.map ?? {}),
        ...(rule.buckets ?? []).map((b) => b.points),
        rule.fallback ?? 0, rule.whenPresent ?? 0, rule.whenAbsent ?? 0,
      ]
      if (values.some((v) => v > rule.max)) bad.push(`${section}: ${rule.field}`)
      if (values.some((v) => v < 0)) bad.push(`${section}: ${rule.field} has negative points`)
    }
    expect(bad).toEqual([])
  })

  it("choice map keys are already normalised (lowercase, single-spaced)", () => {
    const bad: string[] = []
    for (const { section, rule } of allRules) {
      for (const key of Object.keys(rule.map ?? {})) {
        if (key !== key.trim().replace(/\s+/g, " ").toLowerCase()) {
          bad.push(`${section}: ${rule.field} -> "${key}"`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it("the PSS-10 fields the form builds dynamically are all registered", () => {
    const missing = [...DYNAMIC_NAME_FIELDS].filter((f) => !registry.has(f))
    expect(missing).toEqual([])
  })
})
