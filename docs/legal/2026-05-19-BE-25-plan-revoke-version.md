# Advisory legal memo — BE-25 Treatment-plan revoke + version

**Date:** 2026-05-19 (Sprint 1 Day 7)
**Branch:** `task/BE-25-plan-revoke-version` → merged into `main` this shift
**Reviewer:** PM-Agent (advisory only, non-blocking)
**Cc:** Adv. Aman Kaushik <amankaushik39@gmail.com> (no action required unless ≥3 memos accumulate this week)

## Scope of change

Adds two action endpoints on the existing `TreatmentPlan` model (BE-24):

- `POST /api/treatment-plans/[id]/revoke` — flips SIGNED → REVOKED. Stamps `revokedAt`, `revokedById`, optional `revokeReason`. Atomic with audit-log entry.
- `POST /api/treatment-plans/[id]/version` — clones DRAFT/SIGNED/REVOKED plan into a fresh DRAFT, increments `version`, sets `previousVersionId`.
- `lib/services/treatment-plan.ts` — `revokePlan()`, `versionPlan()` service methods.
- `lib/validation/treatment-plan.ts` — `revokeTreatmentPlanSchema`.
- `prisma/schema.prisma` + migration — adds `revokedAt`, `revokedById`, `revokeReason`, `version`, `previousVersionId` columns.

## Surfaces touched (advisory triggers)

- **TreatmentPlan model** — clinical record. Revoke is a status flip, not a delete; versioning creates a successor row and never overwrites the source.

## Sprint-1 posture

- **Append-only clinical record preserved.** Revoke retains the original plan with reason; versioning produces a new row linked by `previousVersionId`. History remains queryable.
- **Authorization:** ADMIN or the DOCTOR who signed/authored. PATIENT role rejected at the handler.
- **Audit trail:** revoke wraps the existing audit-log transaction (BE-23). Versioning records the clone event + new DRAFT creation.
- **State-machine guards:** DRAFT cannot be revoked (400); already-REVOKED rejected (400); 404 on unknown id; 403 on non-author DOCTOR.

## Risk classification

**LOW (Sprint 1)** — additive on an existing clinical model. No new PHI fields, no third-party data flow. Retain-and-stamp aligns with DPDP §8 and DISHA's clinical-record retention expectations.

**MEDIUM (Sprint 2 cutover):**
1. Patient notification on revoke — belongs with FE-09 / notification surface, not BE-25.
2. `revokeReason` is free-form clinical commentary; confirm export-filter posture with Aman in Sprint 2.

## Action

None blocking. Memo on file for the week's running total (2 memos this week so far — under the 3-memo Aman-ping threshold).
