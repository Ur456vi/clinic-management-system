-- Patient Assessment Sheet captures (anthropometrics + vitals). Additive: a new
-- table only, IF NOT EXISTS + guarded FK adds, so it is safe to apply to the
-- shared UAT database without touching existing data.
CREATE TABLE IF NOT EXISTS "vital_assessments" (
  "id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "assessed_at" TIMESTAMP(3) NOT NULL,
  "consultant" TEXT,
  "measurements" JSONB NOT NULL DEFAULT '{}',
  "note" TEXT,
  "created_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vital_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vital_assessments_patient_id_assessed_at_idx"
  ON "vital_assessments" ("patient_id", "assessed_at" DESC);

DO $$ BEGIN
  ALTER TABLE "vital_assessments"
    ADD CONSTRAINT "vital_assessments_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "vital_assessments"
    ADD CONSTRAINT "vital_assessments_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
