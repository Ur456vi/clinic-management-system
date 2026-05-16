# Legal advisory memo — BE-21 patient timeline

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-21-patient-timeline`
**Status:** ADVISORY — merge proceeding.

## Summary
`/api/patients/:id/timeline` reverse-chronological merge of Consultations + Appointments (extensible to LabResults / TreatmentPlans / Invoices).

## Why this is legal-relevant
High-leverage PHI aggregation. Access-control boundary matters more here than on individual endpoints.

## Notes
- Minimal `{id, type, occurredAt, summary, ref}` rows — no symptom/diagnosis body.
- Patient-scope authorization via existing `[id]` route guard pattern.

## Follow-up
- Audit-log the LIST event itself (read-side audit gap for DPDP posture).
- Confirm pagination caps before production.
