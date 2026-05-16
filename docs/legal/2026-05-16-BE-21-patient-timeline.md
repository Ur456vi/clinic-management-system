# Legal advisory memo — BE-21 patient timeline

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-21-patient-timeline`
**Status:** ADVISORY — merge proceeding.

## Summary
Unified `/api/patients/:id/timeline` endpoint that returns reverse-chronological merge of Consultations + Appointments (with hook to extend to LabResults / TreatmentPlans / Invoices).

## Why this is legal-relevant
This is the canonical "what happened to this patient" surface — high-leverage PHI aggregation point. Access-control boundary matters more than for individual endpoints.

## What's in
- Returns minimal `{id, type, occurredAt, summary, ref}` rows — no symptom/diagnosis body in the list view.
- Patient-scope authorization assumed via the existing `[id]` route guard pattern (uses existing patient ACL).

## What needs follow-up
- Audit log the LIST event itself (currently we audit writes but not bulk PHI reads). DPDP audit posture suggests logging "doctor X read patient Y's timeline at T".
- Pagination — current implementation does not advertise a hard cap; ensure offset/limit defaults are sane before production.

## Routing
Advisory only.
