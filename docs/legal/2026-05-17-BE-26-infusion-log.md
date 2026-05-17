# Legal advisory memo — BE-26 infusion log

**Date:** 2026-05-17
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-26-infusion-log`
**Status:** ADVISORY — merge proceeding.

## Summary
Adds InfusionLog model (clinical: drug, dose, route, vitals before/after, adverse-event flag) plus CRUD endpoints and a status-transition route (SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED).

## Why this is legal-relevant
This is clinical PHI of the highest sensitivity in the codebase so far — drug administration, dose, adverse events. DPDP Act + clinical-record retention obligations both apply.

## Notes
- New `InfusionLog` table in `prisma/schema.prisma`; migration `20260516083821_be26_infusion_log`.
- Status transitions are enforced server-side in `lib/services/infusion-log.ts` — no client-controlled state machine.
- Endpoints under `app/api/infusion-logs/**`. Role-scoping should match the consultation/lab-result pattern (DOCTOR / RMO / INFUSION_SPECIALIST write; PATIENT read of own records only).

## Follow-up
- Verify the service layer actually checks INFUSION_SPECIALIST role authorization before write (line-level review in Sprint 2 if time allows).
- Adverse-event entries likely trigger external reporting obligations under DCGI pharmacovigilance — out-of-scope for the demo but flag to Aman before any production cutover.
- Confirm audit-log entry includes `previousStatus → newStatus` on every transition route call.
