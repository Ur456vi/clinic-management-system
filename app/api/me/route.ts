/**
 * `/api/me` — current-user profile.
 *
 *   GET    /api/me   — return the calling user's profile (resolved off the
 *                       session). Shape depends on role:
 *                         - PATIENT-role users get the Patient row's profile fields
 *                         - All other roles get the Staff row's profile fields
 *
 *   PATCH  /api/me   — update the calling user's profile. Allow-list is
 *                       role-scoped so a patient can't set licenseNumber and
 *                       a doctor can't set placeOfResidence by accident.
 *                       The avatar field is NOT updatable here — use
 *                       `POST /api/me/avatar` for that.
 *
 * Every response is the canonical envelope `{ data: ... }` via the
 * `ok()` helper. Avatar URLs are returned as short-lived presigned GETs
 * so the browser doesn't need direct bucket access.
 */

import { z } from "zod"

import {
  defineHandler,
  ok,
  requireSession,
  ValidationError,
} from "@/lib/api"
import { db } from "@/lib/db"
import { getDownloadUrl } from "@/lib/services/storage"

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const trimmedString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)

const optionalNullable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable().optional()

/** Fields a Staff (clinic/admin) user can update on their own profile. */
const staffPatchSchema = z
  .object({
    fullName: trimmedString(120).min(1, "Full name is required"),
    phone: optionalNullable(trimmedString(32)),
    dateOfBirth: optionalNullable(z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"))),
    specialization: optionalNullable(trimmedString(120)),
    licenseNumber: optionalNullable(trimmedString(64)),
    experienceYrs: optionalNullable(z.number().int().min(0).max(80)),
    qualifications: optionalNullable(z.array(trimmedString(120)).max(20)),
    biography: optionalNullable(trimmedString(2000)),
    address: optionalNullable(trimmedString(500)),
  })
  .partial()

/** Fields a Patient user can update on their own profile. */
const patientPatchSchema = z
  .object({
    fullName: trimmedString(120).min(1, "Full name is required"),
    email: optionalNullable(z.string().email("Invalid email").max(255)),
    phone: optionalNullable(trimmedString(32)),
    dateOfBirth: optionalNullable(z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"))),
    // Must match the Prisma `Sex` enum exactly. The DB uses "UNDISCLOSED"
    // (not "UNKNOWN") — keep them in lockstep so Patient.update accepts
    // the value.
    sex: optionalNullable(z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"])),
    occupation: optionalNullable(trimmedString(120)),
    placeOfResidence: optionalNullable(trimmedString(255)),
    address: optionalNullable(trimmedString(500)),
  })
  .partial()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve an S3 object key to a short-lived signed URL. Empty string when
 * no key is stored. We don't 404 — a transient signing error shouldn't
 * break the profile screen.
 */
async function avatarSignedUrl(key: string | null): Promise<string | null> {
  if (!key) return null
  try {
    const { url } = await getDownloadUrl({
      bucket: "assets",
      key,
      ttlSec: 60 * 30, // 30 minutes — long enough for the page to feel snappy
    })
    return url
  } catch {
    return null
  }
}

/** Convert "YYYY-MM-DD" or ISO datetime to a JS Date. */
function parseDate(input: string | null | undefined): Date | null | undefined {
  if (input === null || input === undefined) return input as null | undefined
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError("Invalid date")
  }
  return d
}

// ---------------------------------------------------------------------------
// GET — read profile
// ---------------------------------------------------------------------------

export const GET = defineHandler(async () => {
  const session = await requireSession()
  const role = session.role

  if (role === "PATIENT") {
    const patient = await db.patient.findFirst({
      where: { userId: session.userId },
    })
    if (!patient) {
      // PATIENT users always have a linked patient row in the unified
      // portal model. If not, the data is inconsistent — bubble up so we
      // notice rather than silently returning an empty profile.
      throw new ValidationError("Patient profile not found for this user")
    }
    return ok({
      kind: "patient" as const,
      id: patient.id,
      role,
      email: session.email,
      patientNumber: patient.patientNumber,
      fullName: patient.fullName,
      patientEmail: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      sex: patient.sex,
      occupation: patient.occupation,
      placeOfResidence: patient.placeOfResidence,
      address: patient.address,
      avatarUrl: await avatarSignedUrl(patient.avatarUrl),
      avatarKey: patient.avatarUrl,
    })
  }

  // All non-patient roles share the Staff profile shape.
  const staff = await db.staff.findFirst({
    where: { userId: session.userId },
    include: { department: { select: { id: true, name: true } } },
  })
  if (!staff) {
    throw new ValidationError("Staff profile not found for this user")
  }
  return ok({
    kind: "staff" as const,
    id: staff.id,
    role,
    email: session.email,
    fullName: staff.fullName,
    phone: staff.phone,
    dateOfBirth: staff.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    specialization: staff.specialization,
    licenseNumber: staff.licenseNumber,
    experienceYrs: staff.experienceYrs,
    qualifications: staff.qualifications ?? [],
    biography: staff.biography,
    address: staff.address,
    department: staff.department,
    avatarUrl: await avatarSignedUrl(staff.avatarUrl),
    avatarKey: staff.avatarUrl,
  })
})

// ---------------------------------------------------------------------------
// PATCH — update profile
// ---------------------------------------------------------------------------

export const PATCH = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = await req.json().catch(() => ({}))

  if (session.role === "PATIENT") {
    const parsed = patientPatchSchema.parse(body)
    const patient = await db.patient.update({
      where: { userId: session.userId },
      data: {
        ...(parsed.fullName !== undefined && { fullName: parsed.fullName }),
        ...(parsed.email !== undefined && { email: parsed.email }),
        ...(parsed.phone !== undefined && { phone: parsed.phone }),
        ...(parsed.dateOfBirth !== undefined && {
          dateOfBirth: parseDate(parsed.dateOfBirth) ?? null,
        }),
        ...(parsed.sex !== undefined && { sex: parsed.sex }),
        ...(parsed.occupation !== undefined && { occupation: parsed.occupation }),
        ...(parsed.placeOfResidence !== undefined && {
          placeOfResidence: parsed.placeOfResidence,
        }),
        ...(parsed.address !== undefined && { address: parsed.address }),
      },
    })
    return ok({
      kind: "patient" as const,
      id: patient.id,
      fullName: patient.fullName,
      patientEmail: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      sex: patient.sex,
      occupation: patient.occupation,
      placeOfResidence: patient.placeOfResidence,
      address: patient.address,
    })
  }

  const parsed = staffPatchSchema.parse(body)
  const staff = await db.staff.update({
    where: { userId: session.userId },
    data: {
      ...(parsed.fullName !== undefined && { fullName: parsed.fullName }),
      ...(parsed.phone !== undefined && { phone: parsed.phone }),
      ...(parsed.dateOfBirth !== undefined && {
        dateOfBirth: parseDate(parsed.dateOfBirth) ?? null,
      }),
      ...(parsed.specialization !== undefined && {
        specialization: parsed.specialization,
      }),
      ...(parsed.licenseNumber !== undefined && {
        licenseNumber: parsed.licenseNumber,
      }),
      ...(parsed.experienceYrs !== undefined && {
        experienceYrs: parsed.experienceYrs,
      }),
      ...(parsed.qualifications !== undefined && {
        qualifications: parsed.qualifications ?? [],
      }),
      ...(parsed.biography !== undefined && { biography: parsed.biography }),
      ...(parsed.address !== undefined && { address: parsed.address }),
    },
  })
  return ok({
    kind: "staff" as const,
    id: staff.id,
    fullName: staff.fullName,
    phone: staff.phone,
    dateOfBirth: staff.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    specialization: staff.specialization,
    licenseNumber: staff.licenseNumber,
    experienceYrs: staff.experienceYrs,
    qualifications: staff.qualifications ?? [],
    biography: staff.biography,
    address: staff.address,
  })
})
