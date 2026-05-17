-- BE-26: InfusionLog + InfusionStatus enum.
--
-- Integrative-medicine IV / infusion encounter log. One row per infusion
-- with the per-agent order packed into the `agents` JSONB column (shape
-- validated at the route boundary in `lib/validation/infusion-log.ts`).
-- Lifecycle is `InfusionStatus`; transitions are gated in the service
-- layer (`lib/services/infusion-log.ts`).

-- =========================================================================
-- Enums
-- =========================================================================

CREATE TYPE "InfusionStatus" AS ENUM (
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'ABORTED'
);

-- =========================================================================
-- infusion_logs
-- =========================================================================

CREATE TABLE "infusion_logs" (
  "id"              UUID             NOT NULL DEFAULT gen_random_uuid(),
  "patient_id"      UUID             NOT NULL,
  "consultation_id" UUID,
  "staff_id"        UUID             NOT NULL,
  "protocol"        TEXT             NOT NULL,
  "agents"          JSONB            NOT NULL,
  "started_at"      TIMESTAMP(3)     NOT NULL,
  "completed_at"    TIMESTAMP(3),
  "reaction"        TEXT,
  "status"          "InfusionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)     NOT NULL,

  CONSTRAINT "infusion_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "infusion_logs_patient_id_idx"
  ON "infusion_logs"("patient_id");

CREATE INDEX "infusion_logs_staff_id_idx"
  ON "infusion_logs"("staff_id");

CREATE INDEX "infusion_logs_status_idx"
  ON "infusion_logs"("status");

ALTER TABLE "infusion_logs"
  ADD CONSTRAINT "infusion_logs_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "infusion_logs"
  ADD CONSTRAINT "infusion_logs_consultation_id_fkey"
  FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "infusion_logs"
  ADD CONSTRAINT "infusion_logs_staff_id_fkey"
  FOREIGN KEY ("staff_id") REFERENCES "staff"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
