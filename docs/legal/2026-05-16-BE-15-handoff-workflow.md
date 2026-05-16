# Legal advisory memo — BE-15 consultation handoff workflow

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-15-handoff-workflow`
**Status:** ADVISORY — merge proceeding.

## Summary
Adds `/api/consultations/:id/transition` endpoint + doctor-notification stub. State transitions enforced via consultation service.

## Why this is legal-relevant
Consultation state IS PHI. Notifications trigger external delivery (email-only for demo per Sprint 1 scope cut on DLT-gated SMS).

## What's in
- Transitions wrapped in service layer with AuditLog row.
- Notification is currently a stub — no real send.

## What needs follow-up
- When notifications go live in Sprint 2: ensure email content does NOT include PHI (link only, not symptoms or diagnosis).
- DLT SMS — deferred per Sprint 1 plan.

## Routing
Advisory only. Counts toward weekly digest to Aman.
