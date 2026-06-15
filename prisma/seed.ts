/**
 * Seed script — populates a dev database with the fixtures needed for the
 * Sprint-1 demo (Milestone 1, May 28 2026).
 *
 * Contents (BE-09):
 *   - 1 ADMIN user
 *   - 3 doctors (incl. dr.yuvraaj@example.com — the demo doctor login)
 *   - 1 RMO, 1 reception
 *   - 3 departments (Integrative Medicine, Aesthetics, Rehabilitation)
 *   - 10 patients (incl. priya.patient@example.com — the demo patient login)
 *
 * The script is idempotent: every upsert keys off a stable natural ID
 * (email for users, slug for departments, patientNumber for patients) so
 * re-running the script will not create duplicate rows. Foreign-key fields
 * (e.g. `primaryDoctorId`) are resolved at runtime from the just-upserted
 * records.
 *
 * Demo passwords are bcrypt-hashed with cost 10. The plain values are kept
 * in this file because this script is only meant for dev / staging — never
 * point it at a production DATABASE_URL.
 *
 * Run with:
 *   npm run prisma:seed
 * or directly:
 *   npx tsx prisma/seed.ts
 *
 * BE-09 follow-up (Sprint 1, Day 12): extends the original seed with the
 * clinical-loop fixtures the Demo-Day integration test needs end-to-end --
 *   - 1-2 LabResults per demo patient (Vit-D / Vit-B12 / Ferritin)
 *   - 1 SIGNED TreatmentPlan per demo patient + 2-3 TreatmentPlanItems
 *   - 1 InfusionLog per demo patient (tied to an IV plan item by name)
 *   - 1 PAID Invoice per demo patient + 1-2 InvoiceItems + 1 Payment
 * IDs for these new rows are derived from `sha1(prefix + patient slug + n)`
 * sliced into UUIDv4 shape so re-runs hit `upsert` cleanly without ever
 * double-inserting. We reuse the existing PAT-1000xx / dr.* fixtures and
 * touch *no* new Prisma models.
 */

// Local string-literal mirrors of the schema enums. Prisma accepts these
// string values directly on inputs, so we avoid a hard dependency on the
// generated client for the seed-side type-checking step.
type Role =
  | "ADMIN"
  | "DOCTOR"
  | "RMO"
  | "RECEPTION"
  | "INFUSION_SPECIALIST"
  | "REHAB_SPECIALIST"
  | "AESTHETICS_SPECIALIST"
  | "PATIENT"
type Sex = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
type PatientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"
import { createHash } from "crypto"

import bcrypt from "bcryptjs"

import { db } from "../lib/db"

// ---------------------------------------------------------------------------
// Demo credentials (dev only)
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = "Demo@123"
const BCRYPT_COST = 10

// ---------------------------------------------------------------------------
// Fixture definitions
// ---------------------------------------------------------------------------

type DepartmentSeed = {
  slug: string
  name: string
  description: string
}

const DEPARTMENTS: DepartmentSeed[] = [
  {
    slug: "integrative-medicine",
    name: "Integrative Medicine",
    description:
      "Functional and integrative care — IV nutrient therapy, chelation, " +
      "lifestyle medicine. Dr. Yuvraaj's primary department.",
  },
  {
    slug: "aesthetics",
    name: "Aesthetics",
    description:
      "Cosmetic procedures — PRP, mesotherapy, laser, skin and hair " +
      "treatments.",
  },
  {
    slug: "rehabilitation",
    name: "Rehabilitation",
    description:
      "Physiotherapy, post-procedure rehab, mobility and pain management.",
  },
]

type StaffSeed = {
  email: string
  fullName: string
  role: Role
  departmentSlug: string | null
  phone?: string
  specialization?: string
  licenseNumber?: string
  experienceYrs?: number
  qualifications?: string[]
  biography?: string
}

const STAFF: StaffSeed[] = [
  // --- Admin ---------------------------------------------------------------
  {
    email: "admin@vyara.local",
    fullName: "Vyara Admin",
    role: "ADMIN",
    departmentSlug: null,
    phone: "+91-9000000001",
    qualifications: [],
    biography:
      "Default platform administrator account. Used to bootstrap the " +
      "first clinic in dev/staging.",
  },

  // --- Doctors (3) ---------------------------------------------------------
  {
    email: "dr.yuvraaj@example.com",
    fullName: "Dr. Yuvraaj Singh",
    role: "DOCTOR",
    departmentSlug: "integrative-medicine",
    phone: "+91-9000000010",
    specialization: "Integrative Medicine",
    licenseNumber: "MCI-IM-2014-00123",
    experienceYrs: 12,
    qualifications: ["MBBS", "MD (Internal Medicine)", "Fellowship — IFM"],
    biography:
      "Clinic founder and primary integrative-medicine physician. Demo " +
      "doctor login for the Sprint-1 walkthrough.",
  },
  {
    email: "dr.ananya.rao@example.com",
    fullName: "Dr. Ananya Rao",
    role: "DOCTOR",
    departmentSlug: "aesthetics",
    phone: "+91-9000000011",
    specialization: "Aesthetic Dermatology",
    licenseNumber: "MCI-DERM-2017-04421",
    experienceYrs: 9,
    qualifications: ["MBBS", "MD (Dermatology)"],
    biography:
      "Heads the aesthetics arm — PRP, mesotherapy, laser procedures.",
  },
  {
    email: "dr.rohan.mehta@example.com",
    fullName: "Dr. Rohan Mehta",
    role: "DOCTOR",
    departmentSlug: "rehabilitation",
    phone: "+91-9000000012",
    specialization: "Physical Medicine & Rehabilitation",
    licenseNumber: "MCI-PMR-2016-02210",
    experienceYrs: 10,
    qualifications: ["MBBS", "MD (PMR)"],
    biography: "Lead physiatrist for rehab and post-procedure recovery.",
  },

  // --- RMO (1) -------------------------------------------------------------
  // Sole RMO. Email kept as rmo.kavita@example.com so reseed upserts the
  // existing live row (the display name was changed to Dr. Yashika Kalyani).
  {
    email: "rmo.kavita@example.com",
    fullName: "Dr. Yashika Kalyani",
    role: "RMO",
    departmentSlug: "integrative-medicine",
    phone: "+91-9000000020",
    specialization: "Resident Medical Officer",
    licenseNumber: "MCI-2021-09980",
    experienceYrs: 3,
    qualifications: ["MBBS"],
    biography: "RMO covering intake on the integrative ward.",
  },

  // --- Reception (1) -------------------------------------------------------
  {
    email: "reception@example.com",
    fullName: "Sneha Patil",
    role: "RECEPTION",
    departmentSlug: null,
    phone: "+91-9000000030",
    qualifications: ["B.Com"],
    biography:
      "Front-desk reception — handles walk-ins, appointment confirmations " +
      "and billing intake.",
  },
]

type PatientSeed = {
  patientNumber: string
  fullName: string
  phone: string
  email?: string
  dateOfBirth?: string // YYYY-MM-DD
  sex?: Sex
  occupation?: string
  placeOfResidence?: string
  status?: PatientStatus
  primaryDoctorEmail?: string
  referralSource?: string
}

const PATIENTS: PatientSeed[] = [
  {
    patientNumber: "PAT-100001",
    fullName: "Priya Sharma",
    phone: "+91-9810000001",
    email: "priya.patient@example.com",
    dateOfBirth: "1991-04-12",
    sex: "FEMALE",
    occupation: "Product Manager",
    placeOfResidence: "Bengaluru",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.yuvraaj@example.com",
    referralSource: "Google search",
  },
  {
    patientNumber: "PAT-100002",
    fullName: "Aarav Gupta",
    phone: "+91-9810000002",
    email: "aarav.gupta@example.com",
    dateOfBirth: "1985-09-30",
    sex: "MALE",
    occupation: "Software Engineer",
    placeOfResidence: "Pune",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.yuvraaj@example.com",
    referralSource: "Referral — Dr. A. Rao",
  },
  {
    patientNumber: "PAT-100003",
    fullName: "Meera Nair",
    phone: "+91-9810000003",
    email: "meera.nair@example.com",
    dateOfBirth: "1978-01-22",
    sex: "FEMALE",
    occupation: "School Principal",
    placeOfResidence: "Kochi",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.ananya.rao@example.com",
    referralSource: "Instagram",
  },
  {
    patientNumber: "PAT-100004",
    fullName: "Vikram Singh",
    phone: "+91-9810000004",
    email: "vikram.singh@example.com",
    dateOfBirth: "1965-07-04",
    sex: "MALE",
    occupation: "Retired (Army)",
    placeOfResidence: "Chandigarh",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.rohan.mehta@example.com",
    referralSource: "Walk-in",
  },
  {
    patientNumber: "PAT-100005",
    fullName: "Ishita Banerjee",
    phone: "+91-9810000005",
    dateOfBirth: "2002-11-15",
    sex: "FEMALE",
    occupation: "Student",
    placeOfResidence: "Kolkata",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.ananya.rao@example.com",
    referralSource: "Word of mouth",
  },
  {
    patientNumber: "PAT-100006",
    fullName: "Karan Malhotra",
    phone: "+91-9810000006",
    email: "karan.malhotra@example.com",
    dateOfBirth: "1972-03-08",
    sex: "MALE",
    occupation: "Restaurateur",
    placeOfResidence: "Delhi",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.yuvraaj@example.com",
    referralSource: "Existing patient",
  },
  {
    patientNumber: "PAT-100007",
    fullName: "Sana Khan",
    phone: "+91-9810000007",
    email: "sana.khan@example.com",
    dateOfBirth: "1995-06-19",
    sex: "FEMALE",
    occupation: "Journalist",
    placeOfResidence: "Mumbai",
    status: "ACTIVE",
    referralSource: "Google search",
  },
  {
    patientNumber: "PAT-100008",
    fullName: "Devansh Joshi",
    phone: "+91-9810000008",
    dateOfBirth: "1958-12-02",
    sex: "MALE",
    occupation: "Retired teacher",
    placeOfResidence: "Ahmedabad",
    status: "INACTIVE",
    primaryDoctorEmail: "dr.rohan.mehta@example.com",
    referralSource: "Referral — Dr. R. Mehta",
  },
  {
    patientNumber: "PAT-100009",
    fullName: "Rhea D'Souza",
    phone: "+91-9810000009",
    email: "rhea.dsouza@example.com",
    dateOfBirth: "1989-08-25",
    sex: "FEMALE",
    occupation: "Architect",
    placeOfResidence: "Goa",
    status: "ACTIVE",
    primaryDoctorEmail: "dr.ananya.rao@example.com",
    referralSource: "Instagram",
  },
  {
    patientNumber: "PAT-100010",
    fullName: "Anonymous Patient",
    phone: "+91-9810000010",
    dateOfBirth: "1980-05-05",
    sex: "UNDISCLOSED",
    placeOfResidence: "Bengaluru",
    status: "ARCHIVED",
    referralSource: "Other",
  },
]

// ---------------------------------------------------------------------------
// Seeders
// ---------------------------------------------------------------------------

async function seedDepartments(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>()
  for (const dep of DEPARTMENTS) {
    const row = await db.department.upsert({
      where: { slug: dep.slug },
      update: {
        name: dep.name,
        description: dep.description,
        isActive: true,
      },
      create: {
        slug: dep.slug,
        name: dep.name,
        description: dep.description,
      },
    })
    bySlug.set(dep.slug, row.id)
  }
  console.log(`  departments: ${bySlug.size}`)
  return bySlug
}

async function seedStaff(
  departmentIdBySlug: Map<string, string>,
): Promise<Map<string, string>> {
  const staffIdByEmail = new Map<string, string>()
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST)

  for (const s of STAFF) {
    const departmentId = s.departmentSlug
      ? (departmentIdBySlug.get(s.departmentSlug) ?? null)
      : null

    // Upsert user keyed by email; password hash is refreshed each run so
    // the demo password works after schema resets.
    const user = await db.user.upsert({
      where: { email: s.email },
      update: {
        role: s.role,
        passwordHash,
        isActive: true,
      },
      create: {
        email: s.email,
        role: s.role,
        passwordHash,
      },
    })

    // Upsert Staff keyed by userId (1:1 with User). On re-run we refresh
    // mutable profile fields but keep id stable so FK references survive.
    const staff = await db.staff.upsert({
      where: { userId: user.id },
      update: {
        fullName: s.fullName,
        phone: s.phone ?? null,
        departmentId,
        specialization: s.specialization ?? null,
        licenseNumber: s.licenseNumber ?? null,
        experienceYrs: s.experienceYrs ?? null,
        qualifications: s.qualifications ?? [],
        biography: s.biography ?? null,
        isActive: true,
      },
      create: {
        userId: user.id,
        departmentId,
        fullName: s.fullName,
        phone: s.phone ?? null,
        specialization: s.specialization ?? null,
        licenseNumber: s.licenseNumber ?? null,
        experienceYrs: s.experienceYrs ?? null,
        qualifications: s.qualifications ?? [],
        biography: s.biography ?? null,
      },
    })
    staffIdByEmail.set(s.email, staff.id)
  }
  console.log(`  users + staff: ${staffIdByEmail.size}`)
  return staffIdByEmail
}

async function seedPatients(
  staffIdByEmail: Map<string, string>,
): Promise<number> {
  let count = 0
  let userCount = 0
  // Same hash as staff — one bcrypt for the entire demo seed.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST)

  for (const p of PATIENTS) {
    const primaryDoctorId = p.primaryDoctorEmail
      ? (staffIdByEmail.get(p.primaryDoctorEmail) ?? null)
      : null

    const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null
    const status: PatientStatus = p.status ?? "ACTIVE"
    const deletedAt = status === "ARCHIVED" ? new Date() : null

    // If the patient has an email, mint a PATIENT User row so they can log
    // in to the patient portal with email + DEMO_PASSWORD. The Patient.userId
    // 1:1 link is set below in the same upsert. Without this block, patients
    // exist in the DB but have no auth credential, so NextAuth's authorize()
    // can't find them at the login screen.
    let userId: string | null = null
    if (p.email) {
      const user = await db.user.upsert({
        where: { email: p.email },
        update: {
          role: "PATIENT",
          passwordHash,
          isActive: true,
        },
        create: {
          email: p.email,
          role: "PATIENT",
          passwordHash,
        },
      })
      userId = user.id
      userCount += 1
    }

    await db.patient.upsert({
      // patientNumber is the stable natural key — re-runs match on it.
      where: { patientNumber: p.patientNumber },
      update: {
        fullName: p.fullName,
        phone: p.phone,
        email: p.email ?? null,
        dateOfBirth: dob,
        sex: p.sex ?? null,
        occupation: p.occupation ?? null,
        placeOfResidence: p.placeOfResidence ?? null,
        status,
        primaryDoctorId,
        referralSource: p.referralSource ?? null,
        deletedAt,
        // Refresh the User link on re-runs — User.id is stable (upsert by email).
        userId,
      },
      create: {
        patientNumber: p.patientNumber,
        fullName: p.fullName,
        phone: p.phone,
        email: p.email ?? null,
        dateOfBirth: dob,
        sex: p.sex ?? null,
        occupation: p.occupation ?? null,
        placeOfResidence: p.placeOfResidence ?? null,
        status,
        primaryDoctorId,
        referralSource: p.referralSource ?? null,
        deletedAt,
        userId,
      },
    })
    count += 1
  }
  console.log(`  patients: ${count} (${userCount} with portal logins)`)
  return count
}

// ---------------------------------------------------------------------------
// Clinical-loop fixtures (BE-09 follow-up — Day 12)
// ---------------------------------------------------------------------------
//
// Per-patient bundle: lab results, a signed treatment plan with items, one
// infusion log tied to the plan's IV item, and a PAID invoice with a
// matching payment row. All FKs are resolved from already-seeded
// Patient / Staff records — no new people are created here.
//
// Determinism: each new row's UUID is derived from a stable string
// (`sha1(NAMESPACE + slug)` reshaped into RFC-4122 v4 form), so
// re-running the seed always lands on the same `upsert` target and never
// produces duplicates. The natural keys (e.g. `Invoice.invoiceNumber`)
// are also fixed per-patient for the same reason.

const CLINICAL_LOOP_NS = "vyara.seed.be09.followup.v1"

/// Reshape a sha1 digest into a UUIDv4-format string. We do this rather
/// than reach for the `uuid` package (not in package.json) so the seed
/// stays dependency-clean. The result satisfies Postgres `uuid` casting
/// and matches the version/variant bits Prisma's default generator emits.
function detUuid(...parts: string[]): string {
  const h = createHash("sha1")
    .update(`${CLINICAL_LOOP_NS}|${parts.join("|")}`)
    .digest("hex")
  return (
    h.substring(0, 8) +
    "-" +
    h.substring(8, 12) +
    "-4" +
    h.substring(13, 16) +
    "-a" +
    h.substring(17, 20) +
    "-" +
    h.substring(20, 32)
  )
}

type ClinicalLoopSeed = {
  patientNumber: string
  /// The doctor email driving this patient's care; must already exist in
  /// STAFF above. Used as ordering doctor + plan creator/signer.
  doctorEmail: string
  /// The infusion-administering staff member. RMOs cover infusions in
  /// the Sprint-1 demo since the dedicated infusion specialist role
  /// isn't seeded yet.
  infusionStaffEmail: string
  labs: Array<{
    panel: string
    lab: string
    collectedDaysAgo: number
    reportedDaysAgo: number
    summary: string
    analytes: Array<{
      name: string
      value: number
      unit: string
      refLow?: number
      refHigh?: number
      flag?: "LOW" | "HIGH" | "NORMAL"
    }>
  }>
  plan: {
    title: string
    summary: string
    signedDaysAgo: number
    items: Array<{
      kind: "RX" | "SUPPLEMENT" | "IV" | "REHAB" | "AESTHETIC"
      name: string
      dose?: string
      frequency?: string
      durationDays?: number
      instructions?: string
    }>
  }
  infusion: {
    /// Plan item name (case-insensitive match) the infusion was drawn
    /// from. The seeder resolves the actual id at runtime.
    sourcePlanItemName: string
    protocol: string
    daysAgo: number
    durationMinutes: number
    agents: Array<{
      name: string
      dose: number
      unit: string
      sequence: number
    }>
    reaction?: string
    notes?: string
  }
  invoice: {
    invoiceNumber: string
    placeOfSupply: string
    issuedDaysAgo: number
    paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "RAZORPAY"
    items: Array<{
      description: string
      hsnSac?: string
      quantity: number
      unitPriceCents: number
      taxRateBps: number
    }>
  }
}

/// Three of the existing seeded patients. PAT-100001 / 100002 are
/// Dr. Yuvraaj's; PAT-100003 is Dr. Rao's. The demo script's "doctor
/// sees full profile + history" walkthrough uses PAT-100001 first.
const CLINICAL_LOOP: ClinicalLoopSeed[] = [
  {
    patientNumber: "PAT-100001",
    doctorEmail: "dr.yuvraaj@example.com",
    infusionStaffEmail: "rmo.kavita@example.com",
    labs: [
      {
        panel: "Vitamin D (25-OH)",
        lab: "Metropolis",
        collectedDaysAgo: 21,
        reportedDaysAgo: 19,
        summary: "Vitamin D deficient — supplementation indicated.",
        analytes: [
          {
            name: "25-Hydroxy Vitamin D",
            value: 14.2,
            unit: "ng/mL",
            refLow: 30,
            refHigh: 100,
            flag: "LOW",
          },
        ],
      },
      {
        panel: "Iron Studies",
        lab: "SRL",
        collectedDaysAgo: 21,
        reportedDaysAgo: 18,
        summary: "Low ferritin; iron-deficient picture.",
        analytes: [
          {
            name: "Ferritin",
            value: 9,
            unit: "ng/mL",
            refLow: 15,
            refHigh: 150,
            flag: "LOW",
          },
          {
            name: "Serum Iron",
            value: 42,
            unit: "ug/dL",
            refLow: 50,
            refHigh: 170,
            flag: "LOW",
          },
        ],
      },
    ],
    plan: {
      title: "Iron + Vitamin D infusion course (3 sessions)",
      summary:
        "Three-session IV course over 4 weeks for iron-deficiency anaemia " +
        "and vitamin-D deficiency. Oral supplementation continues between " +
        "sessions; recheck labs at week 6.",
      signedDaysAgo: 14,
      items: [
        {
          kind: "IV",
          name: "Iron sucrose IV + Vitamin D infusion",
          dose: "200 mg iron sucrose + 300,000 IU D3",
          frequency: "Once weekly",
          durationDays: 21,
          instructions:
            "Administer in chair-side IV bay; observe 30 min post-infusion " +
            "for vasovagal reaction.",
        },
        {
          kind: "SUPPLEMENT",
          name: "Oral Vitamin D3 60k",
          dose: "60,000 IU",
          frequency: "Once weekly",
          durationDays: 56,
          instructions: "Take with a fat-containing meal.",
        },
        {
          kind: "SUPPLEMENT",
          name: "Methylcobalamin 1500 mcg",
          dose: "1500 mcg",
          frequency: "Once daily",
          durationDays: 60,
        },
      ],
    },
    infusion: {
      sourcePlanItemName: "Iron sucrose IV + Vitamin D infusion",
      protocol: "Iron sucrose + Vit-D infusion (session 1 of 3)",
      daysAgo: 7,
      durationMinutes: 75,
      agents: [
        { name: "Normal Saline 250 mL", dose: 250, unit: "mL", sequence: 1 },
        { name: "Iron Sucrose", dose: 200, unit: "mg", sequence: 2 },
        { name: "Cholecalciferol (Vit D3)", dose: 300000, unit: "IU", sequence: 3 },
      ],
      reaction: undefined,
      notes:
        "Patient tolerated infusion well. BP stable 118/76 throughout. " +
        "Cleared from chair after 30-min observation.",
    },
    invoice: {
      invoiceNumber: "INV-2026-100001",
      placeOfSupply: "KA",
      issuedDaysAgo: 7,
      paymentMethod: "UPI",
      items: [
        {
          description: "Iron + Vit-D IV infusion (session 1 of 3)",
          hsnSac: "999316",
          quantity: 1,
          // 3500 rupees -> paise (cents) = 350000
          unitPriceCents: 350000,
          taxRateBps: 1800,
        },
        {
          description: "Consultation — Integrative Medicine",
          hsnSac: "999312",
          quantity: 1,
          // 1000 rupees -> 100000
          unitPriceCents: 100000,
          taxRateBps: 1800,
        },
      ],
    },
  },
  {
    patientNumber: "PAT-100002",
    doctorEmail: "dr.yuvraaj@example.com",
    infusionStaffEmail: "rmo.kavita@example.com",
    labs: [
      {
        panel: "Vitamin B12",
        lab: "Metropolis",
        collectedDaysAgo: 30,
        reportedDaysAgo: 28,
        summary: "B12 borderline-low; methylcobalamin indicated.",
        analytes: [
          {
            name: "Vitamin B12",
            value: 178,
            unit: "pg/mL",
            refLow: 211,
            refHigh: 911,
            flag: "LOW",
          },
        ],
      },
    ],
    plan: {
      title: "Methylcobalamin + Glutathione IV (2 sessions)",
      summary:
        "Two-session IV course for chronic fatigue + low B12, with oral " +
        "methylcobalamin maintenance. Re-check B12 at week 8.",
      signedDaysAgo: 10,
      items: [
        {
          kind: "IV",
          name: "Glutathione + B-complex IV push",
          dose: "Glutathione 1200 mg + B-complex 2 mL",
          frequency: "Once fortnightly",
          durationDays: 14,
        },
        {
          kind: "SUPPLEMENT",
          name: "Methylcobalamin 1500 mcg",
          dose: "1500 mcg",
          frequency: "Once daily",
          durationDays: 60,
        },
      ],
    },
    infusion: {
      sourcePlanItemName: "Glutathione + B-complex IV push",
      protocol: "Glutathione push + B-complex (session 1 of 2)",
      daysAgo: 5,
      durationMinutes: 45,
      agents: [
        { name: "Normal Saline 100 mL", dose: 100, unit: "mL", sequence: 1 },
        { name: "Glutathione", dose: 1200, unit: "mg", sequence: 2 },
        { name: "B-Complex", dose: 2, unit: "mL", sequence: 3 },
      ],
      reaction: "Transient metallic taste during push; resolved on slowing rate.",
      notes: "Slowed infusion rate at minute 8; remainder uneventful.",
    },
    invoice: {
      invoiceNumber: "INV-2026-100002",
      placeOfSupply: "MH",
      issuedDaysAgo: 5,
      paymentMethod: "CARD",
      items: [
        {
          description: "Glutathione + B-complex IV push",
          hsnSac: "999316",
          quantity: 1,
          // 4500 rupees -> 450000
          unitPriceCents: 450000,
          taxRateBps: 1800,
        },
      ],
    },
  },
  {
    patientNumber: "PAT-100003",
    doctorEmail: "dr.ananya.rao@example.com",
    infusionStaffEmail: "rmo.kavita@example.com",
    labs: [
      {
        panel: "Vitamin D (25-OH)",
        lab: "in-house",
        collectedDaysAgo: 45,
        reportedDaysAgo: 44,
        summary: "Vitamin D insufficient.",
        analytes: [
          {
            name: "25-Hydroxy Vitamin D",
            value: 22.5,
            unit: "ng/mL",
            refLow: 30,
            refHigh: 100,
            flag: "LOW",
          },
        ],
      },
      {
        panel: "CBC",
        lab: "SRL",
        collectedDaysAgo: 45,
        reportedDaysAgo: 43,
        summary: "Mild anaemia; haemoglobin below the reference range.",
        analytes: [
          {
            name: "Hemoglobin",
            value: 10.8,
            unit: "g/dL",
            refLow: 12.0,
            refHigh: 15.5,
            flag: "LOW",
          },
          {
            name: "MCV",
            value: 78,
            unit: "fL",
            refLow: 80,
            refHigh: 100,
            flag: "LOW",
          },
        ],
      },
    ],
    plan: {
      title: "PRP + Vit-D supplementation (aesthetics support)",
      summary:
        "PRP scalp series (3 sessions) for hair-thinning, with vitamin-D " +
        "and iron repletion to support follicular recovery.",
      signedDaysAgo: 20,
      items: [
        {
          kind: "AESTHETIC",
          name: "PRP scalp injection",
          dose: "4 mL autologous PRP",
          frequency: "Monthly",
          durationDays: 90,
          instructions: "Avoid hair-wash for 24h post-procedure.",
        },
        {
          kind: "IV",
          name: "Vitamin C + Vit-D drip",
          dose: "Ascorbic acid 5 g + D3 300,000 IU",
          frequency: "Once",
          durationDays: 1,
        },
        {
          kind: "SUPPLEMENT",
          name: "Ferrous ascorbate 100 mg",
          dose: "100 mg",
          frequency: "Once daily",
          durationDays: 90,
        },
      ],
    },
    infusion: {
      sourcePlanItemName: "Vitamin C + Vit-D drip",
      protocol: "High-dose Vit-C + Vit-D drip (single dose)",
      daysAgo: 12,
      durationMinutes: 60,
      agents: [
        { name: "Normal Saline 250 mL", dose: 250, unit: "mL", sequence: 1 },
        { name: "Ascorbic Acid", dose: 5, unit: "g", sequence: 2 },
        { name: "Cholecalciferol (Vit D3)", dose: 300000, unit: "IU", sequence: 3 },
      ],
      reaction: undefined,
      notes: "Uneventful infusion; patient discharged after 20-min observation.",
    },
    invoice: {
      invoiceNumber: "INV-2026-100003",
      placeOfSupply: "KL",
      issuedDaysAgo: 12,
      paymentMethod: "CASH",
      items: [
        {
          description: "PRP scalp session 1",
          hsnSac: "999722",
          quantity: 1,
          // 6000 rupees -> 600000
          unitPriceCents: 600000,
          taxRateBps: 1800,
        },
        {
          description: "Vit-C + Vit-D IV drip",
          hsnSac: "999316",
          quantity: 1,
          // 3500 rupees -> 350000
          unitPriceCents: 350000,
          taxRateBps: 1800,
        },
      ],
    },
  },
]

function daysAgo(n: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d
}

async function seedClinicalLoop(
  staffIdByEmail: Map<string, string>,
): Promise<void> {
  let labCount = 0
  let planCount = 0
  let itemCount = 0
  let infusionCount = 0
  let invoiceCount = 0
  let invoiceItemCount = 0
  let paymentCount = 0

  for (const bundle of CLINICAL_LOOP) {
    const patient = await db.patient.findUnique({
      where: { patientNumber: bundle.patientNumber },
      select: { id: true },
    })
    if (!patient) {
      console.warn(
        `  clinical-loop: skipping ${bundle.patientNumber} (patient not seeded)`,
      )
      continue
    }

    const doctorStaffId = staffIdByEmail.get(bundle.doctorEmail) ?? null
    const infusionStaffId = staffIdByEmail.get(bundle.infusionStaffEmail)
    if (!infusionStaffId) {
      console.warn(
        `  clinical-loop: skipping ${bundle.patientNumber} ` +
          `(infusion staff ${bundle.infusionStaffEmail} not seeded)`,
      )
      continue
    }
    // The doctor's User.id is needed for TreatmentPlan.createdById /
    // signedById (those FK the User table, not Staff). Resolve via the
    // already-upserted Staff -> userId link.
    const doctorUser = await db.staff.findUnique({
      where: { id: doctorStaffId ?? "00000000-0000-0000-0000-000000000000" },
      select: { userId: true },
    })
    const doctorUserId = doctorUser?.userId ?? null

    // -- LabResults ----------------------------------------------------------
    for (let i = 0; i < bundle.labs.length; i++) {
      const lab = bundle.labs[i]
      const id = detUuid("lab", bundle.patientNumber, String(i))
      const analytes = lab.analytes.map((a) => ({
        name: a.name,
        value: a.value,
        unit: a.unit,
        refLow: a.refLow ?? null,
        refHigh: a.refHigh ?? null,
        flag: a.flag ?? "NORMAL",
      }))
      await db.labResult.upsert({
        where: { id },
        update: {
          panelName: lab.panel,
          labName: lab.lab,
          collectedAt: daysAgo(lab.collectedDaysAgo),
          reportedAt: daysAgo(lab.reportedDaysAgo),
          orderingDoctorId: doctorStaffId,
          analytes,
          summary: lab.summary,
        },
        create: {
          id,
          patientId: patient.id,
          panelName: lab.panel,
          labName: lab.lab,
          collectedAt: daysAgo(lab.collectedDaysAgo),
          reportedAt: daysAgo(lab.reportedDaysAgo),
          orderingDoctorId: doctorStaffId,
          analytes,
          summary: lab.summary,
        },
      })
      labCount += 1
    }

    // -- TreatmentPlan + items ----------------------------------------------
    const planId = detUuid("plan", bundle.patientNumber)
    const signedAt = daysAgo(bundle.plan.signedDaysAgo)
    await db.treatmentPlan.upsert({
      where: { id: planId },
      update: {
        title: bundle.plan.title,
        summary: bundle.plan.summary,
        status: "SIGNED",
        signedAt,
        signedById: doctorUserId,
        createdById: doctorUserId,
      },
      create: {
        id: planId,
        patientId: patient.id,
        title: bundle.plan.title,
        summary: bundle.plan.summary,
        status: "SIGNED",
        signedAt,
        signedById: doctorUserId,
        createdById: doctorUserId,
        version: 1,
      },
    })
    planCount += 1

    const planItemIds = new Map<string, string>() // name -> id
    for (let i = 0; i < bundle.plan.items.length; i++) {
      const it = bundle.plan.items[i]
      const itemId = detUuid("plan-item", bundle.patientNumber, String(i))
      planItemIds.set(it.name.toLowerCase(), itemId)
      await db.treatmentPlanItem.upsert({
        where: { id: itemId },
        update: {
          kind: it.kind,
          name: it.name,
          dose: it.dose ?? null,
          frequency: it.frequency ?? null,
          durationDays: it.durationDays ?? null,
          instructions: it.instructions ?? null,
          sequence: i,
        },
        create: {
          id: itemId,
          planId,
          kind: it.kind,
          name: it.name,
          dose: it.dose ?? null,
          frequency: it.frequency ?? null,
          durationDays: it.durationDays ?? null,
          instructions: it.instructions ?? null,
          sequence: i,
        },
      })
      itemCount += 1
    }

    // -- InfusionLog --------------------------------------------------------
    // We don't FK the infusion log to a specific plan item — the schema
    // has no such column. Tying happens via shared protocol/agent naming
    // surfaced in the patient timeline (BE-21). The `sourcePlanItemName`
    // field above is kept for documentation / future hard-link.
    void planItemIds // reserved for future linkage
    const infusionId = detUuid("infusion", bundle.patientNumber)
    const startedAt = daysAgo(bundle.infusion.daysAgo)
    const completedAt = new Date(
      startedAt.getTime() + bundle.infusion.durationMinutes * 60 * 1000,
    )
    await db.infusionLog.upsert({
      where: { id: infusionId },
      update: {
        protocol: bundle.infusion.protocol,
        agents: bundle.infusion.agents,
        startedAt,
        completedAt,
        reaction: bundle.infusion.reaction ?? null,
        notes: bundle.infusion.notes ?? null,
        status: "COMPLETED",
        staffId: infusionStaffId,
      },
      create: {
        id: infusionId,
        patientId: patient.id,
        staffId: infusionStaffId,
        protocol: bundle.infusion.protocol,
        agents: bundle.infusion.agents,
        startedAt,
        completedAt,
        reaction: bundle.infusion.reaction ?? null,
        notes: bundle.infusion.notes ?? null,
        status: "COMPLETED",
      },
    })
    infusionCount += 1

    // -- Invoice + items + payment -----------------------------------------
    const invoiceId = detUuid("invoice", bundle.patientNumber)
    const issuedAt = daysAgo(bundle.invoice.issuedDaysAgo)
    // Compute totals from items (mirrors what the service layer does).
    let subtotalCents = 0
    let taxCents = 0
    const itemRows = bundle.invoice.items.map((it, idx) => {
      const lineSubtotal = Math.round(it.unitPriceCents * it.quantity)
      const lineTax = Math.round((lineSubtotal * it.taxRateBps) / 10000)
      subtotalCents += lineSubtotal
      taxCents += lineTax
      return {
        id: detUuid("invoice-item", bundle.patientNumber, String(idx)),
        description: it.description,
        hsnSac: it.hsnSac ?? null,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
        taxRateBps: it.taxRateBps,
        lineSubtotalCents: lineSubtotal,
        lineTaxCents: lineTax,
        lineTotalCents: lineSubtotal + lineTax,
      }
    })
    const totalCents = subtotalCents + taxCents

    await db.invoice.upsert({
      where: { invoiceNumber: bundle.invoice.invoiceNumber },
      update: {
        patientId: patient.id,
        status: "PAID",
        subtotalCents,
        taxCents,
        totalCents,
        gstNumber: "29ABCDE1234F2Z5",
        placeOfSupply: bundle.invoice.placeOfSupply,
        issuedAt,
        notes: "Seeded for clinical-loop demo (BE-09 follow-up).",
      },
      create: {
        id: invoiceId,
        invoiceNumber: bundle.invoice.invoiceNumber,
        patientId: patient.id,
        status: "PAID",
        subtotalCents,
        taxCents,
        totalCents,
        gstNumber: "29ABCDE1234F2Z5",
        placeOfSupply: bundle.invoice.placeOfSupply,
        issuedAt,
        notes: "Seeded for clinical-loop demo (BE-09 follow-up).",
      },
    })
    invoiceCount += 1

    for (const row of itemRows) {
      await db.invoiceItem.upsert({
        where: { id: row.id },
        update: {
          description: row.description,
          hsnSac: row.hsnSac,
          quantity: row.quantity,
          unitPriceCents: row.unitPriceCents,
          taxRateBps: row.taxRateBps,
          lineSubtotalCents: row.lineSubtotalCents,
          lineTaxCents: row.lineTaxCents,
          lineTotalCents: row.lineTotalCents,
          sourceType: "MANUAL",
        },
        create: {
          id: row.id,
          invoiceId,
          description: row.description,
          hsnSac: row.hsnSac,
          quantity: row.quantity,
          unitPriceCents: row.unitPriceCents,
          taxRateBps: row.taxRateBps,
          lineSubtotalCents: row.lineSubtotalCents,
          lineTaxCents: row.lineTaxCents,
          lineTotalCents: row.lineTotalCents,
          sourceType: "MANUAL",
        },
      })
      invoiceItemCount += 1
    }

    const paymentId = detUuid("payment", bundle.invoice.invoiceNumber)
    await db.payment.upsert({
      where: { id: paymentId },
      update: {
        amountCents: totalCents,
        method: bundle.invoice.paymentMethod,
        status: "CAPTURED",
        receivedAt: issuedAt,
        notes: "Auto-captured at reception (seed).",
      },
      create: {
        id: paymentId,
        invoiceId,
        amountCents: totalCents,
        method: bundle.invoice.paymentMethod,
        status: "CAPTURED",
        receivedAt: issuedAt,
        notes: "Auto-captured at reception (seed).",
      },
    })
    paymentCount += 1
  }

  console.log(
    `  clinical loop: labs=${labCount} plans=${planCount} ` +
      `planItems=${itemCount} infusions=${infusionCount} ` +
      `invoices=${invoiceCount} invoiceItems=${invoiceItemCount} ` +
      `payments=${paymentCount}`,
  )
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding Vyara dev database...")

  // Connection sanity check.
  await db.$queryRaw`SELECT 1`

  const departmentIdBySlug = await seedDepartments()
  const staffIdByEmail = await seedStaff(departmentIdBySlug)
  await seedPatients(staffIdByEmail)
  await seedClinicalLoop(staffIdByEmail)

  console.log("Seed complete.")
  console.log(`  Doctor demo login:  dr.yuvraaj@example.com    / ${DEMO_PASSWORD}`)
  console.log(`  Patient demo login: priya.patient@example.com / ${DEMO_PASSWORD}  (PAT-100001)`)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error("Seed failed:", e)
    await db.$disconnect()
    process.exit(1)
  })
