/**
 * Seed script — populates a dev database with the fixtures needed for the
 * Sprint-1 demo (Milestone 1, May 28 2026).
 *
 * Contents (BE-09):
 *   - 1 ADMIN user
 *   - 3 doctors (incl. dr.yuvraaj@example.com — the demo doctor login)
 *   - 2 RMOs, 1 reception
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
 * TODO BE-24: seed 3 treatment plans once the TreatmentPlan / PlanItem
 * models land on main. The Sprint-1 demo plan calls for 3 plans tied to
 * patients PAT-100001 / PAT-100002 / PAT-100003.
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
type Sex = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
type PatientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"
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

  // --- RMOs (2) ------------------------------------------------------------
  {
    email: "rmo.kavita@example.com",
    fullName: "Dr. Kavita Iyer",
    role: "RMO",
    departmentSlug: "integrative-medicine",
    phone: "+91-9000000020",
    specialization: "Resident Medical Officer",
    licenseNumber: "MCI-2021-09980",
    experienceYrs: 3,
    qualifications: ["MBBS"],
    biography: "RMO covering daytime intake on the integrative ward.",
  },
  {
    email: "rmo.arjun@example.com",
    fullName: "Dr. Arjun Verma",
    role: "RMO",
    departmentSlug: "integrative-medicine",
    phone: "+91-9000000021",
    specialization: "Resident Medical Officer",
    licenseNumber: "MCI-2022-11203",
    experienceYrs: 2,
    qualifications: ["MBBS"],
    biography: "RMO covering evening intake on the integrative ward.",
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
  for (const p of PATIENTS) {
    const primaryDoctorId = p.primaryDoctorEmail
      ? (staffIdByEmail.get(p.primaryDoctorEmail) ?? null)
      : null

    const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null
    const status: PatientStatus = p.status ?? "ACTIVE"
    const deletedAt = status === "ARCHIVED" ? new Date() : null

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
      },
    })
    count += 1
  }
  console.log(`  patients: ${count}`)
  return count
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

  // TODO BE-24: seed 3 treatment plans (PAT-100001 / 100002 / 100003) once
  // the TreatmentPlan + PlanItem models land on main.

  console.log("Seed complete.")
  console.log(`  Doctor demo login: dr.yuvraaj@example.com / ${DEMO_PASSWORD}`)
  console.log(`  Patient demo email: priya.patient@example.com (PAT-100001)`)
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
