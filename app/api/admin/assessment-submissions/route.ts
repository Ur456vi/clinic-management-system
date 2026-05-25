/**
 * `GET /api/admin/assessment-submissions`
 *
 * List recent assessment submissions for the admin dashboard. Each row
 * is a single quiz attempt — retakes by the same patient appear as
 * separate rows so the doctor can compare scores over time.
 *
 * Query params:
 *   - take      : page size (default 25, max 100)
 *   - patientId : filter to a specific patient (used by the patient
 *                 chart's "Assessments" tab to show history)
 *   - status    : REQUESTED | CONFIRMED | COMPLETED | CANCELLED
 *
 * Role gate: ADMIN, DOCTOR, RMO, RECEPTION (reception needs to see new
 * bookings to confirm slots; specialists don't need this view).
 */

import { AssessmentSubmissionStatus, Prisma, Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional(),
  patientId: z.string().uuid().optional(),
  status: z.nativeEnum(AssessmentSubmissionStatus).optional(),
})

export const GET = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION)

  const url = new URL(req.url)
  const params = querySchema.parse(Object.fromEntries(url.searchParams))
  const take = params.take ?? 25

  const where: Prisma.AssessmentSubmissionWhereInput = {}
  if (params.patientId) where.patientId = params.patientId
  if (params.status) where.status = params.status

  const rows = await db.assessmentSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          fullName: true,
          email: true,
        },
      },
    },
  })

  return ok({
    items: rows.map((r) => ({
      id: r.id,
      bookingRef: r.bookingRef,
      patient: r.patient,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      preferredAt: r.preferredAt.toISOString(),
      preferredTime: r.preferredTime,
      totalScore: r.totalScore,
      scoreOutOf: r.scoreOutOf,
      band: r.band,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  })
})
