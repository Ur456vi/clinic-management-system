# Legal advisory memo — BE-24 TreatmentPlan model + sign endpoint

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-24-treatment-plan-model`
**Status:** ADVISORY — merge proceeding.

## Summary
`TreatmentPlan` model + line items + `/api/treatment-plans` CRUD + `/api/treatment-plans/:id/sign` doctor sign-off endpoint.

## Why this is legal-relevant
A signed treatment plan is the clinical-decision-of-record. The `sign` endpoint is the moment a draft becomes legally meaningful for the patient and the clinic. Once signed, the row should be **append-only with reason-stamped amendments** (not silent edits).

## What's in
- Sign endpoint records signing doctor + signedAt.
- AuditLog wraps writes.

## What needs follow-up
- Post-signature edits: confirm the service blocks `update` on a signed plan (or routes through amendment-create). Quick check on the diff says it does — confirm with Aman in Sprint 2.
- Patient consent acknowledgment of the plan — UI surface in FE-09 (Day 10).

## Routing
Advisory only.
