/**
 * Field registry for the MAIN (Dr. Yuvraaj) consultation form.
 *
 * Reached from the Appointments kebab -> "Start appointment" when the booking
 * is assigned to a DOCTOR rather than an RMO. The doctor's workspace has a
 * different shape from the RMO intake — four sections in this order:
 *
 *   1. Patient Detail               (editable doctor-side intake)
 *   2. Infusion, Rehab & Aesthetic  (treatment-side planning)
 *   3. Test                         (investigations to order)
 *   4. Final Prescription           (diagnosis + Rx + follow-up)
 *
 * (The RMO intake is reviewed on its own screen —
 * /admin/appointments/[id]/rmo-summary.)
 *
 * Unlike the hand-written RMO markup, the doctor form is config-driven: this
 * module declares the controls and `DoctorConsultation` renders them
 * generically. Values are stored on `Consultation.sections` under the section
 * `key` (last-write-wins shallow merge — see lib/validation/consultation.ts),
 * keyed by the control `n`, exactly like the RMO form.
 *
 * `table` controls hold repeating structured rows (mirroring the tables on
 * the printed prescription, e.g. Supplements: product/dose/timing/duration).
 * Their value is a JSON-encoded `Record<string, string>[]` stored under the
 * control `n` like any other string value, so save/hydrate stay unchanged.
 */

export type TableColumn = { key: string; label: string; placeholder?: string }

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
  | {
      kind: "table"
      n: string
      l: string
      columns: TableColumn[]
      /** "Add row" button label, e.g. "Add supplement". */
      addLabel?: string
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
    slug: "Infusion, Rehab & Aesthetic",
    label: "Infusion, Rehab & Aesthetic",
    description: "IV protocols, rehabilitation, and aesthetic planning",
    key: "infusionRehabAesthetic",
    groups: [
      {
        title: "Infusion / Injectable",
        controls: [
          {
            kind: "table",
            n: "infusionRehabAesthetic__infusion_rows",
            l: "Scheduled Therapies",
            addLabel: "Add therapy",
            full: true,
            columns: [
              { key: "therapy", label: "Therapy", placeholder: "e.g., NAD+ Support Infusion" },
              { key: "dose", label: "Dose", placeholder: "e.g., 250 mg" },
              { key: "schedule", label: "Schedule", placeholder: "e.g., Once Weekly × 4" },
              { key: "purpose", label: "Purpose", placeholder: "e.g., Energy, cellular repair, recovery" },
            ],
          },
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
        title: "Hormonal Profile",
        controls: [
          { kind: "textarea", n: "test__hormonal_profile", l: "Tests Ordered", placeholder: "One per line — e.g., Total Testosterone, Free Testosterone, SHBG, LH, FSH, Estradiol (E2), Prolactin, Cortisol – AM, DHEA-S", rows: 4, full: true },
        ],
      },
      {
        title: "Metabolic & General Profile",
        controls: [
          { kind: "textarea", n: "test__metabolic_general_profile", l: "Tests Ordered", placeholder: "One per line — e.g., CBC, ESR, Fasting Glucose, Insulin & HOMA-IR, HbA1c, Lipid Profile, LFT, KFT, Vitamin D (25-OH), Vitamin B12, Ferritin, hs-CRP, TSH, Free T3, Free T4", rows: 4, full: true },
        ],
      },
      {
        title: "Sample Collection & Reporting",
        controls: [
          { kind: "select", n: "test__priority", l: "Priority", options: ["Routine", "Urgent", "STAT"], placeholder: "Select priority" },
          { kind: "text", n: "test__preferred_lab", l: "Preferred Lab", placeholder: "e.g., Metropolis, SRL, in-house" },
          { kind: "text", n: "test__sample_collection", l: "Sample Collection", placeholder: "e.g., Sample collection at IHMH Lab" },
          { kind: "text", n: "test__report_turnaround", l: "Report Turnaround", placeholder: "e.g., Reports in 48–72 hrs" },
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
        title: "Supplements & Nutraceuticals",
        controls: [
          {
            kind: "table",
            n: "finalPrescription__supplements_rows",
            l: "Supplements",
            addLabel: "Add supplement",
            full: true,
            columns: [
              { key: "product", label: "Product / Supplement", placeholder: "e.g., IHMH Omega-3 (TG form)" },
              { key: "dose", label: "Dose", placeholder: "e.g., 1 Capsule" },
              { key: "timing", label: "Timing", placeholder: "e.g., After Breakfast" },
              { key: "duration", label: "Duration", placeholder: "e.g., 12 Weeks" },
            ],
          },
        ],
      },
      {
        title: "Medications",
        controls: [
          { kind: "textarea", n: "finalPrescription__medications", l: "Medications", placeholder: "Drug — dose — frequency — duration (one per line)", rows: 5, full: true },
        ],
      },
      {
        title: "Lifestyle & Therapeutic Advice",
        controls: [
          { kind: "textarea", n: "finalPrescription__advice_nutrition", l: "Nutrition", placeholder: "e.g., High-protein whole-food diet. Reduce refined carbs & sugar.", rows: 2, full: true },
          { kind: "textarea", n: "finalPrescription__advice_training", l: "Training", placeholder: "e.g., Resistance training 3×/week. Daily 8–10k steps / movement.", rows: 2, full: true },
          { kind: "textarea", n: "finalPrescription__advice_sleep", l: "Sleep & Recovery", placeholder: "e.g., Aim 7–8 hrs sleep. Sleep before 11 PM. Avoid screens 60 min prior.", rows: 2, full: true },
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
