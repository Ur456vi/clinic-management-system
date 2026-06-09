/**
 * Field registry for the MAIN (Dr. Yuvraaj) consultation form.
 *
 * Reached from the Appointments kebab -> "Start appointment" when the booking
 * is assigned to a DOCTOR rather than an RMO. The doctor's workspace has a
 * different shape from the RMO intake — five sections in this order:
 *
 *   1. Patient Detail               (editable doctor-side intake)
 *   2. RMO Summary                  (read-only — the patient's latest RMO chart)
 *   3. Infusion, Rehab & Aesthetic  (treatment-side planning)
 *   4. Test                         (investigations to order)
 *   5. Final Prescription           (diagnosis + Rx + follow-up)
 *
 * Unlike the hand-written RMO markup, the doctor form is config-driven: this
 * module declares the controls and `DoctorConsultation` renders them
 * generically. Values are stored on `Consultation.sections` under the section
 * `key` (last-write-wins shallow merge — see lib/validation/consultation.ts),
 * keyed by the control `n`, exactly like the RMO form.
 *
 * The "RMO Summary" section has no `key`/controls — it is rendered read-only
 * from the `rmoSummary` payload the consultation API attaches for MAIN charts.
 */

export type MainControl =
  | {
      kind: "text" | "date" | "textarea"
      n: string
      l: string
      placeholder?: string
      hint?: string
      rows?: number
      full?: boolean
    }
  | {
      kind: "select"
      n: string
      l: string
      options: string[]
      placeholder?: string
      hint?: string
      full?: boolean
    }

export type MainGroup = { title?: string; controls: MainControl[] }

export type MainSection = {
  /** Left-nav slug (also the React key). */
  slug: string
  /** Display label in the left nav + section header. */
  label: string
  /** Sub-heading under the section title. */
  description: string
  /**
   * `Consultation.sections` top-level key the controls persist under.
   * `null` marks a read-only section with no inputs (RMO Summary).
   */
  key: string | null
  groups: MainGroup[]
}

export const MAIN_SECTIONS: MainSection[] = [
  {
    slug: "Patient Detail",
    label: "Patient Detail",
    description: "Presenting complaint, history, and bedside vitals",
    key: "patientDetail",
    groups: [
      {
        title: "Presentation",
        controls: [
          { kind: "textarea", n: "patientDetail__chief_complaint", l: "Chief Complaint", placeholder: "Primary reason for this visit", rows: 3, full: true },
          { kind: "textarea", n: "patientDetail__history_presenting", l: "History of Presenting Illness", placeholder: "Onset, duration, progression, aggravating / relieving factors", rows: 4, full: true },
        ],
      },
      {
        title: "Background",
        controls: [
          { kind: "textarea", n: "patientDetail__known_allergies", l: "Known Allergies", placeholder: "Drug / food / environmental", rows: 2 },
          { kind: "textarea", n: "patientDetail__current_medications", l: "Current Medications", placeholder: "Names, doses, frequency", rows: 2 },
        ],
      },
      {
        title: "Vitals",
        controls: [
          { kind: "text", n: "patientDetail__vitals_bp", l: "Blood Pressure (mmHg)", placeholder: "e.g., 120/80" },
          { kind: "text", n: "patientDetail__vitals_pulse", l: "Pulse (bpm)", placeholder: "e.g., 72" },
          { kind: "text", n: "patientDetail__vitals_weight", l: "Weight (kg)", placeholder: "e.g., 70" },
          { kind: "text", n: "patientDetail__vitals_height", l: "Height (cm)", placeholder: "e.g., 170" },
          { kind: "text", n: "patientDetail__vitals_spo2", l: "SpO2 (%)", placeholder: "e.g., 98" },
          { kind: "text", n: "patientDetail__vitals_temp", l: "Temperature (°F)", placeholder: "e.g., 98.6" },
        ],
      },
    ],
  },
  {
    slug: "RMO Summary",
    label: "RMO Summary",
    description: "Read-only — the patient's most recent RMO intake",
    key: null,
    groups: [],
  },
  {
    slug: "Infusion, Rehab & Aesthetic",
    label: "Infusion, Rehab & Aesthetic",
    description: "IV protocols, rehabilitation, and aesthetic planning",
    key: "infusionRehabAesthetic",
    groups: [
      {
        title: "Infusion Therapy",
        controls: [
          { kind: "text", n: "infusionRehabAesthetic__infusion_protocol", l: "Protocol", placeholder: "e.g., Myers' Cocktail, Glutathione Push" },
          { kind: "select", n: "infusionRehabAesthetic__infusion_frequency", l: "Frequency", options: ["Once", "Weekly", "Fortnightly", "Monthly"], placeholder: "Select frequency" },
          { kind: "textarea", n: "infusionRehabAesthetic__infusion_agents", l: "Agents & Doses", placeholder: "One per line — agent, dose, unit", rows: 3, full: true },
        ],
      },
      {
        title: "Rehabilitation",
        controls: [
          { kind: "textarea", n: "infusionRehabAesthetic__rehab_plan", l: "Rehab Plan", placeholder: "Physiotherapy, exercises, sessions, goals", rows: 3, full: true },
        ],
      },
      {
        title: "Aesthetic",
        controls: [
          { kind: "textarea", n: "infusionRehabAesthetic__aesthetic_plan", l: "Aesthetic Plan", placeholder: "Procedures, areas, schedule", rows: 3, full: true },
          { kind: "textarea", n: "infusionRehabAesthetic__treatment_notes", l: "Notes", placeholder: "Precautions, consent, reactions to watch", rows: 3, full: true },
        ],
      },
    ],
  },
  {
    slug: "Test",
    label: "Test",
    description: "Investigations and lab panels to order",
    key: "test",
    groups: [
      {
        controls: [
          { kind: "textarea", n: "test__tests_ordered", l: "Tests Ordered", placeholder: "One panel / investigation per line", rows: 4, full: true },
          { kind: "select", n: "test__priority", l: "Priority", options: ["Routine", "Urgent", "STAT"], placeholder: "Select priority" },
          { kind: "text", n: "test__preferred_lab", l: "Preferred Lab", placeholder: "e.g., Metropolis, SRL, in-house" },
          { kind: "textarea", n: "test__test_notes", l: "Notes", placeholder: "Fasting required, sample instructions, clinical context", rows: 3, full: true },
        ],
      },
    ],
  },
  {
    slug: "Final Prescription",
    label: "Final Prescription",
    description: "Diagnosis, medications, advice, and follow-up",
    key: "finalPrescription",
    groups: [
      {
        title: "Diagnosis",
        controls: [
          { kind: "textarea", n: "finalPrescription__diagnosis", l: "Diagnosis", placeholder: "Provisional / final diagnosis", rows: 3, full: true },
        ],
      },
      {
        title: "Prescription",
        controls: [
          { kind: "textarea", n: "finalPrescription__medications", l: "Medications", placeholder: "Drug — dose — frequency — duration (one per line)", rows: 5, full: true },
          { kind: "textarea", n: "finalPrescription__advice", l: "Advice", placeholder: "Diet, lifestyle, precautions", rows: 3, full: true },
        ],
      },
      {
        title: "Follow-up",
        controls: [
          { kind: "date", n: "finalPrescription__follow_up_date", l: "Follow-up Date" },
          { kind: "text", n: "finalPrescription__follow_up_with", l: "Follow-up With", placeholder: "e.g., Dr. Yuvraaj Singh" },
          { kind: "textarea", n: "finalPrescription__follow_up_notes", l: "Follow-up Notes", placeholder: "What to review next visit", rows: 2, full: true },
        ],
      },
    ],
  },
]

/** Flat list of every editable control, for hydration + save. */
export type MainField = { n: string; key: string; l: string }
export const MAIN_FIELDS: MainField[] = MAIN_SECTIONS.flatMap((sec) =>
  sec.key
    ? sec.groups.flatMap((g) => g.controls.map((c) => ({ n: c.n, key: sec.key as string, l: c.l })))
    : [],
)
