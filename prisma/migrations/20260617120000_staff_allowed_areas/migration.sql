-- Per-staff page/area access (RBAC, feature/area level).
-- Empty array = fall back to the staff member's role defaults; a non-empty
-- array is the admin's explicit custom set of admin area keys.
ALTER TABLE "staff"
  ADD COLUMN "allowed_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
