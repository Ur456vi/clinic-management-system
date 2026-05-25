/**
 * `GET /api/admin/assessment-submissions/[id]` — full submission detail
 *   plus the patient's prior submissions (so the detail page can render
 *   the timeline of score improvements).
 *
 * `PATCH /api/admin/assessment-submissions/[id]` — update the lifecycle
 *   status (REQUESTED → CONFIRMED → COMPLETED, or CANCELLED). Reception
 *   uses this to confirm slots; the doctor uses it to mark a visit done.
 */

import { AssessmentSubmissionStatus, Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, NotFoundError, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"

const patchSchema = z.object({
  status: z.nativeEnum(AssessmentSubmissionStatus),
})

export const GET = defineHandler<{ id: string }>(async ({ params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION)
  const { id } = await params

  const row = await db.assessmentSubmission.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          fullName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          sex: true,
        },
      },
    },
  })

  if (!row) {
    throw new NotFoundError(`Assessment submission ${id} not found`)
  }

  // Prior submissions for the same patient — used to render the
  // history mini-chart on the detail page.
  const priorRows = await db.assessmentSubmission.findMany({
    where: { patientId: row.patientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      bookingRef: true,
      totalScore: true,
      scoreOutOf: true,
      band: true,
      status: true,
      createdAt: true,
    },
  })

  return ok({
    submission: {
      id: row.id,
      bookingRef: row.bookingRef,
      patient: row.patient,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      contactSex: row.contactSex,
      preferredAt: row.preferredAt.toISOString(),
      preferredTime: row.preferredTime,
      notes: row.notes,
      totalScore: row.totalScore,
      scoreOutOf: row.scoreOutOf,
      band: row.band,
      byCategory: row.byCategory,
      topRisks: row.topRisks,
      suggestedFocus: row.suggestedFocus,
      answers: row.answers,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    history: priorRows.map((p) => ({
      id: p.id,
      bookingRef: p.bookingRef,
      totalScore: p.totalScore,
      scoreOutOf: p.scoreOutOf,
      band: p.band,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  })
})

export const PATCH = defineHandler<{ id: string }>(async ({ req, params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION)
  const { id } = await params
  const body = patchSchema.parse(await req.json().catch(() => ({})))

  const existing = await db.assessmentSubmission.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError(`Assessment submission ${id} not found`)

  const updated = await db.assessmentSubmission.update({
    where: { id },
    data: { status: body.status },
    select: { id: true, status: true, updatedAt: true },
  })

  return ok({
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  })
})
