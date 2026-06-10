/**
 * Vitals service — record and read point-in-time vitals for a patient.
 *
 * Thin like the other service modules: validation happens in the route,
 * business rules + audit live here. The patient dashboard reads the latest
 * row; the admin patient detail page reads a short history.
 */

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { recordAudit } from "@/lib/services/audit"
import type { CreateVitalInput } from "@/lib/validation/vital"

// A User has no `fullName` of its own — the display name lives on the
// linked Staff row. Select through it and flatten in `shape()`.
const VITAL_INCLUDE = {
  recordedBy: { select: { id: true, staff: { select: { fullName: true } } } },
} as const

type VitalRow = Prisma.VitalGetPayload<{ include: typeof VITAL_INCLUDE }>

export type VitalWithRecorder = Omit<VitalRow, "recordedBy"> & {
  recordedBy: { id: string; fullName: string | null } | null
}

function shape(row: VitalRow): VitalWithRecorder {
  const { recordedBy, ...rest } = row
  return {
    ...rest,
    recordedBy: recordedBy
      ? { id: recordedBy.id, fullName: recordedBy.staff?.fullName ?? null }
      : null,
  }
}

export async function createVital(
  patientId: string,
  recordedById: string,
  input: CreateVitalInput,
): Promise<VitalWithRecorder> {
  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  })
  if (!patient) throw new NotFoundError("Patient not found")

  const created = await db.vital.create({
    data: {
      patientId,
      recordedById,
      systolic: input.systolic ?? null,
      diastolic: input.diastolic ?? null,
      heartRate: input.heartRate ?? null,
      weightKg: input.weightKg ?? null,
      heightCm: input.heightCm ?? null,
      temperatureF: input.temperatureF ?? null,
      spo2: input.spo2 ?? null,
      notes: input.notes ?? null,
      ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
    },
    include: VITAL_INCLUDE,
  })

  await recordAudit({
    actorUserId: recordedById,
    action: "CREATE",
    entityType: "Vital",
    entityId: created.id,
  })

  return shape(created)
}

export async function listVitals(
  patientId: string,
  limit = 20,
): Promise<VitalWithRecorder[]> {
  const rows = await db.vital.findMany({
    where: { patientId },
    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(limit, 1), 100),
    include: VITAL_INCLUDE,
  })
  return rows.map(shape)
}

export async function getLatestVital(
  patientId: string,
): Promise<VitalWithRecorder | null> {
  const row = await db.vital.findFirst({
    where: { patientId },
    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
    include: VITAL_INCLUDE,
  })
  return row ? shape(row) : null
}

/** Resolve the Patient row for a portal (PATIENT-role) user. */
export async function patientIdForUser(userId: string): Promise<string | null> {
  const p = await db.patient.findUnique({
    where: { userId },
    select: { id: true },
  })
  return p?.id ?? null
}
