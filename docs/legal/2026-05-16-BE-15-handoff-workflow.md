# Legal advisory memo — BE-15 consultation handoff workflow

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-15-handoff-workflow`
**Status:** ADVISORY — merge proceeding.

## Summary
`/api/consultations/:id/transition` + doctor-notification stub. Transitions enforced via consultation service.

## Why this is legal-relevant
Consultation state is PHI. Notifications trigger external delivery (email-only per Sprint-1 SMS deferral).

## Notes
- Transitions wrapped in service with AuditLog.
- Notification is a stub — no real send.

## Follow-up
- When notifications go live (Sprint 2): email content must not include PHI (link only, no symptoms / diagnosis).
- DLT SMS deferred per Sprint 1 plan.
