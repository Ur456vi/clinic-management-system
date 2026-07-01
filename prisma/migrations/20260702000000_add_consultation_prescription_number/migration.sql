-- Add a stored, human-readable prescription number to consultations.
-- Minted once when a MAIN consultation transitions to SIGNED.
-- Additive + nullable: safe to run against a populated database (no backfill,
-- existing rows keep NULL). Format: "IPHMH-PRESC/26-27/06-0100".
ALTER TABLE "consultations" ADD COLUMN "prescription_number" TEXT;

CREATE UNIQUE INDEX "consultations_prescription_number_key"
  ON "consultations" ("prescription_number");
