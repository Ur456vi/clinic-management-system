# Legal advisory memo — BE-23 appointment booking endpoint

**Date:** 2026-05-17
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-23-appointment-booking-endpoint`
**Status:** ADVISORY — merge proceeding.

## Summary
Adds `GET /api/appointments/availability` and `POST /api/appointments/book`. Patient-self-book branch resolves `Patient` via `Patient.userId`; on-behalf branch gated to ADMIN / RECEPTION roles. Booking re-validates the slot under `db.$transaction`.

## Why this is legal-relevant
Touches the Appointment schema and is the first patient-portal write endpoint for PHI-adjacent data (slot reservation tied to a patient identity). Booking creates a permanent audit-relevant record.

## Notes
- Role gate: ADMIN/RECEPTION for on-behalf; PATIENT for self. DOCTOR/RMO directed to existing `POST /api/appointments`.
- Service layer enforces slot-conflict + working-hours overlay; no duplicate enforcement in the route.
- Self-book branch does not accept an explicit `patientId` — prevents trivial cross-patient bookings from a compromised patient session.
- No new PHI fields introduced; the schema for `Appointment` was already merged via BE-27.

## Follow-up
- Confirm audit-log row is written on every booking (Sprint 2: tie into BE-23-audit-log-infra once that lands cleanly).
- Rate-limit `/availability` before production (anonymous-enumerable staff IDs are an information-leakage vector).
