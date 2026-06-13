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
    description: "Demographics, history, vitals, and examination",
    key: "patientDetail",
    groups: [
      {
        title: "Demographics & Registration",
        controls: [
          { kind: "date", n: "patientDetail__dob", l: "Date of Birth" },
          { kind: "select", n: "patientDetail__gender", l: "Gender", options: ["Male", "Female", "Other"], placeholder: "Select gender" },
          { kind: "text", n: "patientDetail__contact", l: "Contact Number", placeholder: "e.g., +91 98XXXXXXXX" },
          { kind: "text", n: "patientDetail__email", l: "Email", placeholder: "e.g., patient@example.com" },
          { kind: "text", n: "patientDetail__occupation", l: "Occupation", placeholder: "e.g., Corporate – Finance" },
          { kind: "select", n: "patientDetail__referred_by", l: "Referred By", options: ["Self", "Doctor", "Relative", "Friend", "Other"], placeholder: "Select referral" },
          { kind: "date", n: "patientDetail__registration_date", l: "Registration Date" },
        ],
      },
      {
        title: "Consultation Details",
        controls: [
          { kind: "date", n: "patientDetail__consultation_date", l: "Consultation Date" },
          { kind: "text", n: "patientDetail__consultation_duration", l: "Duration (minutes)", placeholder: "e.g., 42" },
          { kind: "select", n: "patientDetail__consultation_mode", l: "Mode", options: ["In-Clinic", "Online"], placeholder: "Select mode" },
        ],
      },
      {
        title: "Preliminary Consultation Summary (RMO)",
        controls: [
          { kind: "date", n: "patientDetail__assessment_date", l: "Assessment Date" },
          { kind: "text", n: "patientDetail__reviewed_by", l: "Reviewed By", placeholder: "e.g., Dr. Yuvraaj Singh" },
          { kind: "date", n: "patientDetail__reviewed_on", l: "Reviewed On" },
          { kind: "textarea", n: "patientDetail__chief_concerns", l: "Chief Concerns Reported", placeholder: "One per line — e.g., Fatigue & low energy for 8–10 months", rows: 4, full: true },
          { kind: "textarea", n: "patientDetail__relevant_medical_history", l: "Relevant Medical History", placeholder: "e.g., No known chronic illness. Occasional gastritis. No regular medications.", rows: 3, full: true },
          { kind: "textarea", n: "patientDetail__family_history", l: "Family History", placeholder: "e.g., Father – Hypertension & Diabetes", rows: 2, full: true },
        ],
      },
      {
        title: "Presentation",
        controls: [
          { kind: "textarea", n: "patientDetail__chief_complaint", l: "Chief Complaint", placeholder: "Primary reason for this visit", rows: 3, full: true },
          { kind: "textarea", n: "patientDetail__history_presenting", l: "History of Presenting Illness", placeholder: "Onset, duration, progression, aggravating / relieving factors", rows: 4, full: true },
          { kind: "textarea", n: "patientDetail__additional_clinical_notes", l: "Additional History & Clinical Notes", placeholder: "Work stress, meals, sleep pattern, sexual health, habits — one per line", rows: 4, full: true },
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
          { kind: "text", n: "patientDetail__vitals_rr", l: "Respiratory Rate (/min)", placeholder: "e.g., 16" },
          { kind: "text", n: "patientDetail__vitals_weight", l: "Weight (kg)", placeholder: "e.g., 70" },
          { kind: "text", n: "patientDetail__vitals_height", l: "Height (cm)", placeholder: "e.g., 170" },
          { kind: "text", n: "patientDetail__vitals_spo2", l: "SpO2 (%)", placeholder: "e.g., 98" },
          { kind: "text", n: "patientDetail__vitals_temp", l: "Temperature (°F)", placeholder: "e.g., 98.6" },
        ],
      },
      {
        title: "Anthropometrics & Body Composition",
        controls: [
          { kind: "date", n: "patientDetail__anthro_measured_on", l: "Measured On" },
          { kind: "text", n: "patientDetail__anthro_bmi", l: "BMI (kg/m²)", placeholder: "e.g., 27.5" },
          { kind: "text", n: "patientDetail__anthro_body_fat", l: "Body Fat %", placeholder: "e.g., 21.8" },
          { kind: "text", n: "patientDetail__anthro_waist", l: "Waist Circumference (cm)", placeholder: "e.g., 94" },
          { kind: "text", n: "patientDetail__anthro_hip", l: "Hip Circumference (cm)", placeholder: "e.g., 98" },
          { kind: "text", n: "patientDetail__anthro_whr", l: "Waist–Hip Ratio", placeholder: "e.g., 0.96" },
        ],
      },
      {
        title: "Systemic Exam",
        controls: [
          { kind: "text", n: "patientDetail__exam_cvs", l: "CVS", placeholder: "e.g., S1S2 normal, no murmurs" },
          { kind: "text", n: "patientDetail__exam_rs", l: "RS", placeholder: "e.g., Clear" },
          { kind: "text", n: "patientDetail__exam_pa", l: "P/A", placeholder: "e.g., Soft, non-tender" },
          { kind: "text", n: "patientDetail__exam_cns", l: "CNS", placeholder: "e.g., NAD" },
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
          { kind: "textarea", n: "finalPrescription__clinical_impression", l: "Clinical Impression", placeholder: "e.g., Male with features of androgen deficiency with metabolic dysregulation.", rows: 3, full: true },
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
