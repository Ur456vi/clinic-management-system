-- Lab partner integration (Mahajan Imaging / MI Partner) — approach 1.
--
-- ADDITIVE ONLY. Safe to apply to the shared UAT RDS: it creates new enum
-- types and tables and touches nothing that already exists. Written to be
-- idempotent (guarded CREATE TYPE + CREATE TABLE/INDEX IF NOT EXISTS) so a
-- re-run on a drifted database is a no-op rather than an error.
--
-- Apply with `prisma migrate deploy` (preferred), or manually via
-- `prisma db execute --file <this>` followed by
-- `prisma migrate resolve --applied 20260823000000_add_lab_integration`.
-- Do NOT run `prisma migrate dev` against DATABASE_URL — it targets the live
-- shared UAT database and would reset data.

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "LabCollectionMode" AS ENUM ('HOME', 'CENTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LabOrderStatus" AS ENUM (
    'PENDING_NOTIFY', 'NOTIFIED', 'SCHEDULED', 'IN_PROGRESS',
    'COMPLETED', 'CANNOT_COMPLETE', 'CANCELLED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LabWebhookKind" AS ENUM ('REPORT_STATUS', 'ORDER_STATUS', 'CENTER_STATUS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- lab_products (cache of getAllProducts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_products" (
  "id"          UUID NOT NULL,
  "lab_test_id" TEXT NOT NULL,
  "test_name"   TEXT NOT NULL,
  "normalized"  TEXT NOT NULL,
  "raw"         JSONB NOT NULL DEFAULT '{}',
  "synced_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lab_products_lab_test_id_key" ON "lab_products" ("lab_test_id");
CREATE INDEX IF NOT EXISTS "lab_products_normalized_idx" ON "lab_products" ("normalized");

-- ---------------------------------------------------------------------------
-- lab_centers (cache of getAllCenters)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_centers" (
  "id"          UUID NOT NULL,
  "center_code" TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "raw"         JSONB NOT NULL DEFAULT '{}',
  "synced_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_centers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lab_centers_center_code_key" ON "lab_centers" ("center_code");

-- ---------------------------------------------------------------------------
-- lab_test_mappings (curated our-testKey -> partner labTestId)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_test_mappings" (
  "id"            UUID NOT NULL,
  "test_key"      TEXT NOT NULL,
  "lab_test_id"   TEXT NOT NULL,
  "lab_test_name" TEXT NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lab_test_mappings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lab_test_mappings_test_key_key" ON "lab_test_mappings" ("test_key");
CREATE INDEX IF NOT EXISTS "lab_test_mappings_lab_test_id_idx" ON "lab_test_mappings" ("lab_test_id");

-- ---------------------------------------------------------------------------
-- lab_orders (one pushed prescription-notify)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_orders" (
  "id"              UUID NOT NULL,
  "order_number"    TEXT NOT NULL,
  "patient_id"      UUID NOT NULL,
  "consultation_id" UUID,
  "collection_mode" "LabCollectionMode" NOT NULL DEFAULT 'HOME',
  "center_code"     TEXT,
  "status"          "LabOrderStatus" NOT NULL DEFAULT 'PENDING_NOTIFY',
  "items"           JSONB NOT NULL DEFAULT '[]',
  "request_payload" JSONB,
  "last_response"   JSONB,
  "notify_error"    TEXT,
  "appointment_id"  TEXT,
  "work_order_id"   TEXT,
  "order_case_id"   TEXT,
  "report_url"      TEXT,
  "report_status"   TEXT,
  "lab_number"      TEXT,
  "reason"          TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lab_orders_order_number_key" ON "lab_orders" ("order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "lab_orders_consultation_id_key" ON "lab_orders" ("consultation_id");
CREATE INDEX IF NOT EXISTS "lab_orders_patient_id_created_at_idx" ON "lab_orders" ("patient_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "lab_orders_status_idx" ON "lab_orders" ("status");

DO $$ BEGIN
  ALTER TABLE "lab_orders"
    ADD CONSTRAINT "lab_orders_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lab_orders"
    ADD CONSTRAINT "lab_orders_consultation_id_fkey"
    FOREIGN KEY ("consultation_id") REFERENCES "consultations" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- lab_webhook_events (inbound webhook audit + idempotency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lab_webhook_events" (
  "id"           UUID NOT NULL,
  "kind"         "LabWebhookKind" NOT NULL,
  "order_number" TEXT,
  "lab_order_id" UUID,
  "payload"      JSONB NOT NULL,
  "processed"    BOOLEAN NOT NULL DEFAULT false,
  "error"        TEXT,
  "received_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lab_webhook_events_order_number_idx" ON "lab_webhook_events" ("order_number");
CREATE INDEX IF NOT EXISTS "lab_webhook_events_kind_received_at_idx" ON "lab_webhook_events" ("kind", "received_at" DESC);

DO $$ BEGIN
  ALTER TABLE "lab_webhook_events"
    ADD CONSTRAINT "lab_webhook_events_lab_order_id_fkey"
    FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
