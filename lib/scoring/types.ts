/**
 * IPHMH scoring types.
 *
 * Direction: this is a WELLNESS score — higher is healthier. The public-site
 * quiz in `components/public/assessment/` is a RISK score running the opposite
 * way. Never render the two side by side without labelling which is which.
 */

/**
 * `manual` is a document item the form cannot derive a value for — a free-text
 * control, or a single select where the document wants a block of independent
 * findings. It declares the item's `max` so the section still reconciles
 * against the document total, and the RMO supplies the number by hand.
 *
 * `timeWindow` scores an `<input type="time">` against a clock range.
 */
export type RuleKind =
  | "choice" | "numericRange" | "multiSelect" | "present" | "manual" | "timeWindow"

export type RedFlagSeverity = "high" | "moderate"

/** A numeric bucket. `min` is inclusive, `max` is exclusive. */
export type NumericBucket = {
  min?: number
  max?: number
  points: number
  redFlag?: RedFlagSeverity
}

/**
 * One scored question (or, for `multiSelect`, one block of them).
 *
 * `field` is the control name from `lib/rmo-fields.ts`. A rule whose field is
 * not in that registry is a config bug — `config.test.ts` fails the build for
 * it, because a typo would otherwise silently score the question zero forever.
 */
export type ScoreRule = {
  field: string
  /** Human label for admin drill-down. Never reaches the patient portal. */
  label: string
  /** Maximum points this rule can contribute. */
  max: number
  kind: RuleKind
  /**
   * How many underlying questions this rule represents. 1 for everything except
   * `multiSelect`, where it is the number of options. Drives completeness.
   */
  items?: number

  /** `choice`: normalised answer value -> points. Keys must be lowercase. */
  map?: Record<string, number>
  /** Points when a `choice` answer matches nothing in `map`. Default 0. */
  fallback?: number

  /** `numericRange`: ordered buckets, first match wins. */
  buckets?: NumericBucket[]

  /** `multiSelect`: the full option universe, verbatim from the form. */
  options?: string[]
  /** `multiSelect`: points for an option that IS selected (a symptom present). */
  presentPoints?: number
  /** `multiSelect`: points for an option that is NOT selected. */
  absentPoints?: number

  /** `present`: points when the control holds any value / holds none. */
  whenPresent?: number
  whenAbsent?: number

  /** `timeWindow`: inclusive "HH:MM" bounds. Wraps midnight when end < start. */
  windowStart?: string
  windowEnd?: string

  /** Normalised values that raise a red flag, or a predicate over one. */
  redFlagWhen?: string[] | ((normalised: string) => boolean)
  redFlagSeverity?: RedFlagSeverity

  /**
   * false while the source document does not pin this rule down. Unconfirmed
   * rules still evaluate, but the section reports them so the admin diagnostics
   * panel can show what is provisional. See `SCORING_OPEN_QUESTIONS`.
   */
  confirmed: boolean
}

export type SectionKey =
  | "bowel" | "sleep" | "bladder" | "energy" | "libido" | "mentation"
  | "diet" | "exercise" | "bodyWeight" | "hygiene" | "temperature"
  | "womensHealth" | "misc" | "mensHealth" | "gpe" | "stress"
  | "systemic" | "pastMedical" | "pastSurgical" | "personalHabits"

export type Applicability = "always" | "female" | "male"

export type SectionConfig = {
  key: SectionKey
  name: string
  /**
   * The total printed in the source document. Authoritative for display, even
   * where the rules below do not yet sum to it (see `reconciles`).
   */
  declaredMax: number
  appliesWhen?: Applicability
  rules: ScoreRule[]
  /**
   * true when sum(rules.max) === declaredMax. false means the document's own
   * arithmetic is unresolved; the section is excluded from the overall score
   * and listed in the diagnostics panel.
   */
  reconciles: boolean
  /** Why a section does not reconcile, or is not yet collectable. */
  note?: string
  /** false keeps the section out of every score until it is signed off. */
  active: boolean
}

export type RedFlagRef = {
  field: string
  label: string
  section: SectionKey
  severity: RedFlagSeverity
}

export type SectionScore = {
  key: SectionKey
  name: string
  score: number
  maxScore: number
  /** Questions actually answered, and questions that applied. */
  answered: number
  applicable: number
  /**
   * Questions left out of the completeness denominator because a blank answer
   * is ambiguous — the B-20 bare-checkbox controls, where "healthy" and
   * "never asked" store the same nothing.
   */
  indeterminate: number
  /** Questions whose score the RMO entered or overrode by hand. */
  manual: number
  redFlags: RedFlagRef[]
  /** Rules in this section still awaiting document sign-off. */
  unconfirmed: number
}

export type ScoreResult = {
  scoringVersion: string
  totalScore: number
  maxScore: number
  sections: SectionScore[]
  redFlagCount: number
  /** Answered / applicable across every active section. 0..1. */
  completeness: number
}

/** What the patient portal is allowed to see. No red flags, no diagnostics. */
export type PatientSectionScore = Pick<SectionScore, "key" | "name" | "score" | "maxScore">

export type PatientScoreResult = {
  totalScore: number
  maxScore: number
  sections: PatientSectionScore[]
  /**
   * Answered / applicable, 0..1.
   *
   * The one diagnostic the portal DOES carry. A partial assessment is shown
   * rather than withheld, so the number has to arrive with the caveat attached
   * — without it a 25% score drawn from a third of the questions reads as a
   * health verdict. Red flags and per-question points stay out.
   */
  completeness: number
}

export type Sex = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"

export type PatientContext = {
  /** From `Patient.sex`. */
  sex?: Sex | null
  /** From `demographics__sex` on this consultation; preferred when present. */
  consultationSex?: string | null
}

/** Flat answers, keyed by RMO registry field name. */
export type Answers = Record<string, string>
