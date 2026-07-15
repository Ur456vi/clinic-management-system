-- Lab test mapping (our catalog test -> partner lab testId/testName). Additive:
-- a single new table + guarded indexes, safe to apply to the shared UAT
-- database without touching existing data.
CREATE TABLE IF NOT EXISTS "lab_test_mappings" (
  "id" UUID NOT NULL,
  "test_key" TEXT NOT NULL,
  "test_name" TEXT NOT NULL,
  "lab_test_id" TEXT NOT NULL,
  "lab_test_name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lab_test_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lab_test_mappings_test_key_key"
  ON "lab_test_mappings" ("test_key");
CREATE INDEX IF NOT EXISTS "lab_test_mappings_active_idx"
  ON "lab_test_mappings" ("active");
