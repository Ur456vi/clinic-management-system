/**
 * `POST /api/assessment-booking`
 *
 * Accepts the completed quiz payload + booking slot + patient details
 * from the public-site Health Assessment wizard.
 *
 * Behaviour:
 *   1. Validate the payload with zod.
 *   2. Upsert a Patient by email — if no patient with that email exists
 *      we create one, generating a fresh `PAT-XXXXXX` number using the
 *      same temp scheme `lib/services/patient.ts` uses for staff-created
 *      patients. Existing patients are left untouched (we don't want a
 *      stranger overwriting their name/phone — those changes only happen
 *      in the admin UI today).
 *   3. INSERT a new `AssessmentSubmission` row — every attempt creates a
 *      fresh record so the doctor can compare scores over time. We never
 *      update an existing submission.
 *   4. Return `{ bookingId, createdAt, patientId }`. The patientId lets
 *      the admin app deep-link from the submissions list straight to the
 *      patient's chart.
 *
 * Public endpoint — no auth required. The CSRF same-origin check in
 * `defineHandler()` still applies so cross-origin scripts can't post.
 */

import {
  AssessmentBand,
  AssessmentSubmissionStatus,
  Prisma,
  AuditAction,
  Role,
  AppointmentStatus,
  Sex,
} from "@prisma/client";
import { randomUUID, randomBytes } from "node:crypto";
import { z } from "zod";

import { defineHandler, logger, ok } from "@/lib/api";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/passwords";
import { sendMail } from "@/lib/email";
import {
  patientBookingNewAccountEmail,
  patientBookingReturningEmail,
} from "@/lib/email-templates";

const patientSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().trim().min(6, "Phone is too short").max(32),
  sex: z.enum(["male", "female", "other"]).nullable(),
});

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  notes: z.string().max(2000).nullable().optional(),
});

const assessmentSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  scoreOutOf: z.number().int().positive(),
  band: z.enum(["optimal", "mild", "moderate", "significant"]),
  topRisks: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        severity: z.enum(["High", "Moderate", "Low"]),
      }),
    )
    .max(6),
  suggestedFocus: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .max(6),
  byCategory: z.record(z.string(), z.number().int().min(0)),
  /** Opaque per-question answers — kept as JSON so we don't have to keep
   *  the validator in lockstep with new question kinds. */
  answers: z.record(z.string(), z.unknown()),
});

const bodySchema = z.object({
  patient: patientSchema,
  slot: slotSchema,
  assessment: assessmentSchema,
});

const BAND_MAP: Record<
  z.infer<typeof assessmentSchema>["band"],
  AssessmentBand
> = {
  optimal: AssessmentBand.OPTIMAL,
  mild: AssessmentBand.MILD,
  moderate: AssessmentBand.MODERATE,
  significant: AssessmentBand.SIGNIFICANT,
};

/**
 * Generate the next `PAT-XXXXXX` identifier inside the given transaction.
 *
 * TEMPORARY (mirrors `lib/services/patient.ts`): this scans for the max
 * existing number and adds one. There is a race here under concurrent
 * inserts; the @@unique on `patientNumber` will reject duplicates and we
 * surface them as a 5xx — acceptable for the public-site booking volume
 * we expect in this iteration. BE-09 swaps both call-sites for a real
 * Postgres sequence.
 */
async function nextPatientNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const last = await tx.patient.findFirst({
    where: { patientNumber: { startsWith: "PAT-" } },
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  });
  let n = 1;
  if (last) {
    const tail = Number(last.patientNumber.slice(4));
    if (Number.isFinite(tail) && tail > 0) n = tail + 1;
  }
  return `PAT-${String(n).padStart(6, "0")}`;
}

export const POST = defineHandler(async ({ req, requestId }) => {
  const json = await req.json().catch(() => ({}));
  const body = bodySchema.parse(json);

  const preferredAt = new Date(`${body.slot.date}T${body.slot.time}:00`);
  if (Number.isNaN(preferredAt.getTime())) {
    return ok({ bookingId: null, error: "Invalid date/time combination" });
  }

  const bookingRef = `BOOK-${randomUUID().slice(0, 8).toUpperCase()}`;
  const emailNormalised = body.patient.email.trim().toLowerCase();

  // Generate secure temporary password and hash it before starting the transaction
  // to avoid holding locks or timing out the transaction on slow CPU hashing operations.
  const generatedPassword = `DrYS@${randomBytes(4).toString("hex")}`;
  const passwordHash = await hashPassword(generatedPassword);

  const { submission, patient, isNewPatient, tempPassword } = await db.$transaction(
    async (tx) => {
      // ── 1. Upsert the patient by email ────────────────────────────
      const existing = await tx.patient.findFirst({
        where: { email: { equals: emailNormalised, mode: "insensitive" } },
        select: { id: true, fullName: true, email: true, patientNumber: true, primaryDoctorId: true },
      });

      let patientRow: { id: string; patientNumber: string };
      let isNew = false;
      let tempPasswordUsed = "";

      if (existing) {
        patientRow = existing;
      } else {
        isNew = true;
        tempPasswordUsed = generatedPassword;

        // Create User record
        const user = await tx.user.create({
          data: {
            email: emailNormalised,
            passwordHash,
            role: Role.PATIENT,
            isActive: true,
            // Account is created with a system-generated temp password that
            // is emailed to the patient. Force a reset on first login.
            mustResetPassword: true,
          },
          select: { id: true },
        });

        // Audit user creation
        await tx.auditLog.create({
          data: {
            actorUserId: null,
            action: AuditAction.CREATE,
            entityType: "User",
            entityId: user.id,
            detail: { role: Role.PATIENT, email: emailNormalised },
          },
        });

        const patientNumber = await nextPatientNumber(tx);
        const created = await tx.patient.create({
          data: {
            patientNumber,
            fullName: body.patient.name,
            email: emailNormalised,
            phone: body.patient.phone,
            sex: mapSex(body.patient.sex),
            referralSource: "Public site — Health Assessment",
            userId: user.id,
          },
          select: { id: true, patientNumber: true },
        });
        patientRow = created;

        // Audit patient creation
        await tx.auditLog.create({
          data: {
            actorUserId: null,
            action: AuditAction.CREATE,
            entityType: "Patient",
            entityId: created.id,
            detail: { patientNumber, fullName: body.patient.name },
          },
        });
      }

      // ── 2. Find a default RMO and create Appointment ───────────────
      //     Assessment intake is triaged by an RMO, never assigned to a
      //     doctor directly. The RMO reviews scores and routes onward.
      const defaultRmo = await tx.staff.findFirst({
        where: { user: { role: Role.RMO } },
        select: { id: true },
      });

      if (!defaultRmo) {
        throw new Error("No active RMO found to assign the appointment.");
      }

      const selectedDoctorId = defaultRmo.id;

      const endsAt = new Date(preferredAt.getTime() + 45 * 60 * 1000);

      const appointment = await tx.appointment.create({
        data: {
          patientId: patientRow.id,
          staffId: selectedDoctorId,
          startsAt: preferredAt,
          endsAt,
          status: AppointmentStatus.REQUESTED,
          reason: "Comprehensive Hormone & Metabolic Assessment",
          notes: body.slot.notes ?? null,
        },
        select: { id: true },
      });

      // Audit appointment creation
      await tx.auditLog.create({
        data: {
          actorUserId: null,
          action: AuditAction.CREATE,
          entityType: "Appointment",
          entityId: appointment.id,
          detail: {
            channel: "PUBLIC_WIZARD",
            patientId: patientRow.id,
            staffId: selectedDoctorId,
            startsAt: preferredAt.toISOString(),
            endsAt: endsAt.toISOString(),
          },
        },
      });

      // ── 3. Insert the assessment submission ───────────────────────
      const inserted = await tx.assessmentSubmission.create({
        data: {
          patientId: patientRow.id,
          contactName: body.patient.name,
          contactEmail: emailNormalised,
          contactPhone: body.patient.phone,
          contactSex: body.patient.sex,
          preferredAt,
          preferredTime: body.slot.time,
          notes: body.slot.notes ?? null,
          totalScore: body.assessment.totalScore,
          scoreOutOf: body.assessment.scoreOutOf,
          band: BAND_MAP[body.assessment.band],
          byCategory:
            body.assessment.byCategory as unknown as Prisma.InputJsonValue,
          topRisks: body.assessment.topRisks as unknown as Prisma.InputJsonValue,
          suggestedFocus:
            body.assessment.suggestedFocus as unknown as Prisma.InputJsonValue,
          answers: body.assessment.answers as Prisma.InputJsonValue,
          bookingRef,
          status: AssessmentSubmissionStatus.REQUESTED,
        },
        select: { id: true, createdAt: true, bookingRef: true },
      });

      return {
        submission: inserted,
        patient: patientRow,
        isNewPatient: isNew,
        tempPassword: tempPasswordUsed,
      };
    },
    {
      timeout: 15000,
    }
  );

  logger.info(
    {
      requestId,
      bookingRef: submission.bookingRef,
      submissionId: submission.id,
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      isNewPatient,
      preferredAt: preferredAt.toISOString(),
      band: body.assessment.band,
      totalScore: body.assessment.totalScore,
    },
    "assessment-booking: persisted",
  );

  // ── 4. Send email via Brevo/Resend (best-effort async) ────────────────
  const dateStr = preferredAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = body.slot.time;

  const loginUrl = `${env.APP_URL}/login`;
  const mail = isNewPatient
    ? patientBookingNewAccountEmail({
        patientName: body.patient.name,
        dateStr,
        timeStr,
        loginUrl,
        email: emailNormalised,
        tempPassword,
      })
    : patientBookingReturningEmail({
        patientName: body.patient.name,
        dateStr,
        timeStr,
        loginUrl,
      });

  const emailResult = await sendMail({
    to: emailNormalised,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  if (!emailResult.ok) {
    logger.error(
      {
        requestId,
        emailNormalised,
        provider: emailResult.provider,
        error: emailResult.error,
      },
      "assessment-booking: failed to send confirmation email",
    );
  }

  return ok({
    bookingId: submission.bookingRef,
    submissionId: submission.id,
    patientId: patient.id,
    patientNumber: patient.patientNumber,
    isNewPatient,
    createdAt: submission.createdAt.toISOString(),
  });
});

/** Map the UI's lower-case sex strings to the Prisma `Sex` enum we use
 *  for the Patient row. Returns `null` when the patient declined to say. */
function mapSex(s: "male" | "female" | "other" | null) {
  if (s === "male") return "MALE";
  if (s === "female") return "FEMALE";
  if (s === "other") return "OTHER";
  return null;
}
