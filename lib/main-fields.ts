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
      /**
       * Adds an "Add from library" picker next to "Add row".
       *  - "rx": full meds + supplements catalog → fills the FIRST column.
       *  - "supplements": supplements / nutraceuticals only (no Rx drugs) →
       *    fills the FIRST column. Use for the Supplements section so a
       *    prescription drug can't be entered as a supplement.
       *  - "infusion": IV protocol catalog → adds one row per component in the
       *    FIRST column.
       */
      library?: "rx" | "infusion" | "supplements"
    }
  | {
      kind: "testPanels"
      n: string
      l: string
      hint?: string
      full?: boolean
    }
  | {
      kind: "medicationsLibrary"
      n: string
      l: string
      placeholder?: string
      rows?: number
      hint?: string
      full?: boolean
    }

export type MainGroup = {
  title?: string
  controls: MainControl[]
  /**
   * Optional inline action rendered after the group's controls.
   * `recordVitals` posts the Vitals fields to the patient's Vitals record
   * (so they show up in "Latest Vitals"), de-duped by an explicit button.
   */
  action?: "recordVitals"
}

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
        title: "Demographics",
        controls: [
          { kind: "date", n: "patientDetail__dob", l: "Date of Birth" },
          { kind: "select", n: "patientDetail__gender", l: "Gender", options: ["Male", "Female", "Other"], placeholder: "Select gender" },
          { kind: "text", n: "patientDetail__contact", l: "Contact Number", placeholder: "e.g., +91 98XXXXXXXX" },
          { kind: "text", n: "patientDetail__email", l: "Email", placeholder: "e.g., patient@example.com" },
          { kind: "text", n: "patientDetail__occupation", l: "Occupation", placeholder: "e.g., Corporate – Finance" },
          { kind: "select", n: "patientDetail__referred_by", l: "Referred By", options: ["Self", "Doctor", "Relative", "Friend", "Other"], placeholder: "Select referral" },
        ],
      },
      {
        title: "Consultation Details",
        controls: [
          { kind: "date", n: "patientDetail__consultation_date", l: "Consultation Date" },
          { kind: "text", n: "patientDetail__consultation_duration", l: "Duration (minutes)", placeholder: "e.g., 42" },
        ],
      },
      // The RMO intake (chief concerns, history, family history, background,
      // anthropometrics, registration date) is captured in the RMO consultation
      // and reviewed via "View RMO Summary" — not re-entered here.
      {
        title: "Presentation",
        controls: [
          { kind: "textarea", n: "patientDetail__chief_complaint", l: "Chief Complaint", placeholder: "Primary reason for this visit", rows: 3, full: true },
          { kind: "textarea", n: "patientDetail__history_presenting", l: "History of Presenting Illness", placeholder: "Onset, duration, progression, aggravating / relieving factors", rows: 4, full: true },
          { kind: "textarea", n: "patientDetail__additional_clinical_notes", l: "Additional History & Clinical Notes", placeholder: "Work stress, meals, sleep pattern, sexual health, habits — one per line", rows: 4, full: true },
        ],
      },
      {
        title: "Vitals",
        action: "recordVitals",
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
            library: "infusion",
            full: true,
            columns: [
              { key: "therapy", label: "Therapy", placeholder: "e.g., NAD+ Support Infusion" },
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
        controls: [
          { kind: "testPanels", n: "test__selected_tests", l: "Select Test Panels", full: true },
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
        title: "Medications & Supplements",
        controls: [
          {
            kind: "table",
            n: "finalPrescription__supplements_rows",
            l: "Medications & Supplements",
            addLabel: "Add item",
            // Full meds + supplements catalog. Picking from the library
            // auto-fills product / dose / timing (parsed from the entry).
            library: "rx",
            full: true,
            columns: [
              { key: "product", label: "Medication / Supplement", placeholder: "e.g., Magnesium Glycinate" },
              { key: "dose", label: "Dose", placeholder: "e.g., 200 mg" },
              { key: "timing", label: "Timing", placeholder: "e.g., After Breakfast" },
              { key: "duration", label: "Duration", placeholder: "e.g., 12 Weeks" },
            ],
          },
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
