-- Partner-lab integration (inbound webhook). Additive only: two new enums +
-- two new tables, all created with guarded / IF NOT EXISTS statements so this
-- is safe to apply to the shared UAT database without touching existing data.

-- Enums (CREATE TYPE has no IF NOT EXISTS — guard against re-apply).
DO $$ BEGIN
  CREATE TYPE "PartnerLabOrderStatus" AS ENUM (
    'CREATED', 'ACKNOWLEDGED', 'SAMPLE_COLLECTED', 'IN_PROGRESS',
    'RESULT_READY', 'CANCELLED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LabWebhookStatus" AS ENUM (
    'RECEIVED', 'PROCESSED', 'UNMATCHED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- partner_lab_orders -------------------------------------------------------
CREATE TABLE IF NOT EXISTS "partner_lab_orders" (
  "id" UUID NOT NULL,
  "order_number" TEXT NOT NULL,
  "patient_id" UUID NOT NULL,
  "consultation_id" UUID,
  "lab_result_id" UUID,
  "external_order_id" TEXT,
  "status" "PartnerLabOrderStatus" NOT NULL DEFAULT 'CREATED',
  "request_snapshot" JSONB,
  "last_event_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_lab_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_lab_orders_order_number_key"
  ON "partner_lab_orders" ("order_number");
CREATE INDEX IF NOT EXISTS "partner_lab_orders_patient_id_idx"
  ON "partner_lab_orders" ("patient_id");
CREATE INDEX IF NOT EXISTS "partner_lab_orders_status_idx"
  ON "partner_lab_orders" ("status");

DO $$ BEGIN
  ALTER TABLE "partner_lab_orders"
    ADD CONSTRAINT "partner_lab_orders_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "partner_lab_orders"
    ADD CONSTRAINT "partner_lab_orders_consultation_id_fkey"
    FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "partner_lab_orders"
    ADD CONSTRAINT "partner_lab_orders_lab_result_id_fkey"
    FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- lab_webhook_events -------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_webhook_events" (
  "id" UUID NOT NULL,
  "order_number" TEXT,
  "event_type" TEXT,
  "dedupe_key" TEXT,
  "raw_payload" JSONB NOT NULL,
  "signature_ok" BOOLEAN NOT NULL DEFAULT false,
  "status" "LabWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
  "matched" BOOLEAN NOT NULL DEFAULT false,
  "partner_lab_order_id" UUID,
  "error" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  CONSTRAINT "lab_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lab_webhook_events_dedupe_key_key"
  ON "lab_webhook_events" ("dedupe_key");
CREATE INDEX IF NOT EXISTS "lab_webhook_events_order_number_idx"
  ON "lab_webhook_events" ("order_number");
CREATE INDEX IF NOT EXISTS "lab_webhook_events_status_idx"
  ON "lab_webhook_events" ("status");

DO $$ BEGIN
  ALTER TABLE "lab_webhook_events"
    ADD CONSTRAINT "lab_webhook_events_partner_lab_order_id_fkey"
    FOREIGN KEY ("partner_lab_order_id") REFERENCES "partner_lab_orders"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
