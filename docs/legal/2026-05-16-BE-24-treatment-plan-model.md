# Legal advisory memo — BE-24 TreatmentPlan model + sign endpoint

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-24-treatment-plan-model`
**Status:** ADVISORY — merge proceeding.

## Summary
`TreatmentPlan` + line items + `/api/treatment-plans` CRUD + `/api/treatment-plans/:id/sign` doctor sign-off.

## Why this is legal-relevant
A signed treatment plan is the clinical-decision-of-record. Post-signature edits must be reason-stamped amendments, not silent updates.

## Notes
- Sign endpoint records signing doctor + signedAt.
- AuditLog wrapping in place.

## Follow-up
- Confirm service blocks `update` on a signed plan or routes through amendment-create.
- Patient consent acknowledgement of the plan — UI surfaces in FE-09 (Day 10).
