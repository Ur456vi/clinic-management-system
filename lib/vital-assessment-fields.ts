/**
 * Canonical field list for the Patient Assessment Sheet (IPHMH anthropometrics
 * + vitals). One entry per row of the paper sheet, in order. Shared by the
 * admin modal (input form) and the read-only display so the two never drift.
 *
 * `position` mirrors the sheet's grouping (Standing → Sitting → Supine →
 * Standing). Note "Standing" appears twice (steps 1-16 and step 26); render by
 * consecutive runs of `position`, not by grouping the value, to preserve order.
 *
 * Values are stored as free-text strings in `VitalAssessment.measurements`
 * (a JSON map keyed by `key`) — several rows are non-numeric (blood pressure
 * "120/80", the hyper-flexibility test).
 */

export type VitalFieldPosition = "Standing" | "Sitting" | "Supine"

export type VitalField = {
  /** Stable storage key in the measurements JSON map. */
  key: string
  /** Sheet step number (1-26). */
  step: number
  position: VitalFieldPosition
  label: string
  /** Display unit; empty string when the row has no unit. */
  unit: string
}

export const VITAL_ASSESSMENT_FIELDS: readonly VitalField[] = [
  // Standing (1-16)
  { key: "height", step: 1, position: "Standing", label: "Height", unit: "cm" },
  { key: "weight", step: 2, position: "Standing", label: "Weight", unit: "kg" },
  { key: "bmi", step: 3, position: "Standing", label: "BMI", unit: "kg/m²" },
  { key: "BP", step: 4, position: "Standing", label: "Blood Pressure", unit: "mmHg" },
  { key: "muac", step: 5, position: "Standing", label: "Mid-Arm Circumference (MUAC)", unit: "cm" },
  { key: "midForearm", step: 6, position: "Standing", label: "Mid-Forearm Circumference", unit: "cm" },
  { key: "neckCircumference", step: 7, position: "Standing", label: "Neck Circumference", unit: "cm" },
  { key: "chestCircumference", step: 8, position: "Standing", label: "Chest Circumference", unit: "cm" },
  { key: "hemithoraxRight", step: 9, position: "Standing", label: "Hemithorax Circumference (RIGHT)", unit: "cm" },
  { key: "hemithoraxLeft", step: 10, position: "Standing", label: "Hemithorax Circumference (LEFT)", unit: "cm" },
  { key: "chestExpansionInspiration", step: 11, position: "Standing", label: "Chest Expansion (Inspiration)", unit: "cm" },
  { key: "chestExpansionExpiration", step: 12, position: "Standing", label: "Chest Decompression (Expiration)", unit: "cm" },
  { key: "chestExpansion", step: 13, position: "Standing", label: "Chest Expansion", unit: "cm" },
  { key: "armSpan", step: 14, position: "Standing", label: "Arm Span", unit: "cm" },
  { key: "waistCircumference", step: 15, position: "Standing", label: "Waist Circumference", unit: "cm" },
  { key: "midCalf", step: 16, position: "Standing", label: "Mid-Calf (Mid-Tibial) Circumference", unit: "cm" },
  { key: "ankleGirth", step: 17, position: "Standing", label: "Ankle Girth", unit: "cm" },
  // Sitting (18-23)
  { key: "bpSitting", step: 18, position: "Sitting", label: "Blood Pressure", unit: "mmHg" },
  { key: "pulseRate", step: 19, position: "Sitting", label: "Pulse Rate", unit: "bpm" },
  { key: "respiratoryRate", step: 20, position: "Sitting", label: "Respiratory Rate", unit: "breaths/min" },
  { key: "spo2", step: 21, position: "Sitting", label: "SpO₂", unit: "%" },
  { key: "bodyTemperature", step: 22, position: "Sitting", label: "Body Temperature", unit: "°F" },
  { key: "hyperFlexibilityTest", step: 23, position: "Sitting", label: "Hyper flexibility Test", unit: "" },
  { key: "neckLength", step: 24, position: "Sitting", label: "Neck Length", unit: "cm" },
  // Supine (25-26)
  { key: "bpSupine", step: 25, position: "Supine", label: "Blood Pressure", unit: "mmHg" },
  { key: "abdominalGirth", step: 26, position: "Supine", label: "Abdominal Girth", unit: "cm" },
  // Standing (26)
  { key: "bpOrthostatic", step: 27, position: "Standing", label: "Blood Pressure (Orthostatic, if indicated)", unit: "mmHg" },
]

/** Set of valid measurement keys — used to sanitize inbound JSON server-side. */
export const VITAL_ASSESSMENT_KEYS: ReadonlySet<string> = new Set(
  VITAL_ASSESSMENT_FIELDS.map((f) => f.key),
)

/** Look up a field's label/unit by key (for read-only rendering). */
export const VITAL_FIELD_BY_KEY: ReadonlyMap<string, VitalField> = new Map(
  VITAL_ASSESSMENT_FIELDS.map((f) => [f.key, f]),
)
