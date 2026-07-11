-- Add an optional single summary file (PDF / DOCX / image / Excel) to an
-- infusion session. Additive + idempotent: nullable columns, IF NOT EXISTS,
-- so it is safe to apply to the shared UAT database without touching data.
ALTER TABLE "infusions" ADD COLUMN IF NOT EXISTS "summary_key" TEXT;
ALTER TABLE "infusions" ADD COLUMN IF NOT EXISTS "summary_mime" TEXT;
ALTER TABLE "infusions" ADD COLUMN IF NOT EXISTS "summary_filename" TEXT;
ALTER TABLE "infusions" ADD COLUMN IF NOT EXISTS "summary_size_bytes" INTEGER;
