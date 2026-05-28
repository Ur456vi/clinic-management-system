-- Adds the AssessmentSubmission table for capturing public-site Health
-- Assessment quiz completions. Each submission is immutable (a retake
-- inserts a fresh row) so the doctor can compare a patient's scores over
-- time. The row is linked to a Patient that the booking API upserts by
-- email before inserting the submission.

-- ── Enums ───────────────────────────────────────────────────────────────
CREATE TYPE "AssessmentBand" AS ENUM (
  'OPTIMAL',
  'MILD',
  'MODERATE',
  'SIGNIFICANT'
);

CREATE TYPE "AssessmentSubmissionStatus" AS ENUM (
  'REQUESTED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED'
);

-- ── Table ───────────────────────────────────────────────────────────────
CREATE TABLE "assessment_submissions" (
  "id"               UUID                          NOT NULL DEFAULT gen_random_uuid(),
  "patient_id"       UUID                          NOT NULL,

  "contact_name"     TEXT                          NOT NULL,
  "contact_email"    CITEXT                        NOT NULL,
  "contact_phone"    TEXT                          NOT NULL,
  "contact_sex"      TEXT,

  "preferred_at"     TIMESTAMPTZ                   NOT NULL,
  "preferred_time"   TEXT                          NOT NULL,
  "notes"            TEXT,

  "total_score"      INTEGER                       NOT NULL,
  "score_out_of"     INTEGER                       NOT NULL,
  "band"             "AssessmentBand"              NOT NULL,

  "by_category"      JSONB                         NOT NULL,
  "top_risks"        JSONB                         NOT NULL,
  "suggested_focus"  JSONB                         NOT NULL,
  "answers"          JSONB                         NOT NULL,

  "booking_ref"      TEXT                          NOT NULL,
  "status"           "AssessmentSubmissionStatus"  NOT NULL DEFAULT 'REQUESTED',

  "created_at"       TIMESTAMP(3)                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3)                  NOT NULL,

  CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX "assessment_submissions_booking_ref_key"
  ON "assessment_submissions" ("booking_ref");

CREATE INDEX "assessment_submissions_created_at_idx"
  ON "assessment_submissions" ("created_at" DESC);

CREATE INDEX "assessment_submissions_patient_id_created_at_idx"
  ON "assessment_submissions" ("patient_id", "created_at" DESC);

CREATE INDEX "assessment_submissions_status_idx"
  ON "assessment_submissions" ("status");

-- ── Foreign keys ────────────────────────────────────────────────────────
ALTER TABLE "assessment_submissions"
  ADD CONSTRAINT "assessment_submissions_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
