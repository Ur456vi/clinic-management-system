-- Lab scheduling (zero-Salesforce-change model).
--
-- ADDITIVE ONLY. Adds the PENDING_SCHEDULE lifecycle value, the LabBookedVia
-- enum, and the slot columns on lab_orders. Safe + idempotent on the drifted
-- UAT RDS. Apply with `prisma migrate deploy` (never `migrate dev`).

-- New lifecycle value (order awaiting a slot chosen on our side).
ALTER TYPE "LabOrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_SCHEDULE';

-- Who booked the slot.
DO $$ BEGIN
  CREATE TYPE "LabBookedVia" AS ENUM ('RECEPTION', 'PATIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Slot + booking-source columns on lab_orders.
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "appointment_start" TIMESTAMPTZ;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "appointment_end"   TIMESTAMPTZ;
ALTER TABLE "lab_orders" ADD COLUMN IF NOT EXISTS "booked_via" "LabBookedVia";
