-- BE-25: TreatmentPlan revoke + version columns.
--
-- Adds the revoke metadata stamped by `/api/treatment-plans/:id/revoke`
-- and the `previous_version_id` back-pointer used by
-- `/api/treatment-plans/:id/version`. The `version` integer column
-- already shipped with BE-24 at default 1.
--
-- onDelete policies mirror the rest of the model:
--   - revoked_by_id → users.id  ON DELETE SET NULL  (keep the plan row
--     intact when the actor is removed; matches signed_by_id).
--   - previous_version_id → treatment_plans.id  ON DELETE SET NULL
--     (a pruned ancestor must not orphan its descendants — version
--     chain is best-effort, not a hard constraint).

ALTER TABLE "treatment_plans"
  ADD COLUMN "previous_version_id" UUID,
  ADD COLUMN "revoked_at"          TIMESTAMP(3),
  ADD COLUMN "revoked_by_id"       UUID,
  ADD COLUMN "revoke_reason"       TEXT;

ALTER TABLE "treatment_plans"
  ADD CONSTRAINT "treatment_plans_previous_version_id_fkey"
    FOREIGN KEY ("previous_version_id")
    REFERENCES "treatment_plans"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE "treatment_plans"
  ADD CONSTRAINT "treatment_plans_revoked_by_id_fkey"
    FOREIGN KEY ("revoked_by_id")
    REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX "treatment_plans_previous_version_id_idx"
  ON "treatment_plans"("previous_version_id");
