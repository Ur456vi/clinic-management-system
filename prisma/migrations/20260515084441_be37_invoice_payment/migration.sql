-- BE-37: Invoice / InvoiceItem / Payment + supporting enums.
--
-- Money is stored as integer *_cents columns; tax rate is basis points
-- (`tax_rate_bps` — 1800 == 18.00%) so we never round-trip through
-- floating point. Invoice soft-delete is `status = 'VOID'` — there is
-- no `is_active` boolean.

-- =========================================================================
-- Enums
-- =========================================================================

CREATE TYPE "InvoiceStatus" AS ENUM (
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'VOID'
);

CREATE TYPE "InvoiceItemSourceType" AS ENUM (
  'MANUAL',
  'CONSULTATION',
  'TREATMENT_PLAN',
  'INFUSION_SESSION'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'RAZORPAY'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'CAPTURED',
  'FAILED',
  'REFUNDED'
);

-- =========================================================================
-- invoices
-- =========================================================================

CREATE TABLE "invoices" (
  "id"              UUID            NOT NULL DEFAULT gen_random_uuid(),
  "invoice_number"  TEXT            NOT NULL,
  "patient_id"      UUID            NOT NULL,
  "appointment_id"  UUID,
  "subtotal_cents"  INTEGER         NOT NULL,
  "tax_cents"       INTEGER         NOT NULL,
  "total_cents"     INTEGER         NOT NULL,
  "gst_number"      TEXT,
  "place_of_supply" TEXT,
  "status"          "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "notes"           TEXT,
  "issued_at"       TIMESTAMP(3),
  "due_at"          TIMESTAMP(3),
  "created_at"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3)    NOT NULL,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_invoice_number_key"
  ON "invoices"("invoice_number");

CREATE INDEX "invoices_patient_id_created_at_idx"
  ON "invoices"("patient_id", "created_at" DESC);

CREATE INDEX "invoices_status_idx"
  ON "invoices"("status");

CREATE INDEX "invoices_appointment_id_idx"
  ON "invoices"("appointment_id");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================================
-- invoice_items
-- =========================================================================

CREATE TABLE "invoice_items" (
  "id"                   UUID                    NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id"           UUID                    NOT NULL,
  "description"          TEXT                    NOT NULL,
  "hsn_sac"              TEXT,
  "quantity"             DECIMAL(10,3)           NOT NULL DEFAULT 1,
  "unit_price_cents"     INTEGER                 NOT NULL,
  "tax_rate_bps"         INTEGER                 NOT NULL,
  "line_subtotal_cents"  INTEGER                 NOT NULL,
  "line_tax_cents"       INTEGER                 NOT NULL,
  "line_total_cents"     INTEGER                 NOT NULL,
  "source_type"          "InvoiceItemSourceType" NOT NULL DEFAULT 'MANUAL',
  "source_ref_id"        UUID,
  "created_at"           TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_items_invoice_id_idx"
  ON "invoice_items"("invoice_id");

CREATE INDEX "invoice_items_source_type_source_ref_id_idx"
  ON "invoice_items"("source_type", "source_ref_id");

ALTER TABLE "invoice_items"
  ADD CONSTRAINT "invoice_items_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- payments
-- =========================================================================

CREATE TABLE "payments" (
  "id"           UUID            NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id"   UUID            NOT NULL,
  "amount_cents" INTEGER         NOT NULL,
  "method"       "PaymentMethod" NOT NULL,
  "status"       "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "gateway_ref"  TEXT,
  "received_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"        TEXT,
  "created_at"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payments_invoice_id_received_at_idx"
  ON "payments"("invoice_id", "received_at" DESC);

CREATE INDEX "payments_status_idx"
  ON "payments"("status");

CREATE INDEX "payments_gateway_ref_idx"
  ON "payments"("gateway_ref");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
