# Legal advisory — task/BE-27-appointment-model

**Date filed:** 2026-05-15 (PM Agent 07:30 shift)
**Branch:** `task/BE-27-appointment-model`
**Merge decision:** MERGE (advisory; non-blocking under Sprint 1 mode and under standard policy)

## Surfaces touched

- `prisma/schema.prisma` — adds `Appointment` model and `AppointmentStatus` enum.
- New API routes: `app/api/appointments/route.ts`, `app/api/appointments/[id]/route.ts`, `app/api/appointments/[id]/transition/route.ts`.
- New service / validation: `lib/services/appointment.ts`, `lib/validation/appointment.ts`.
- Docs: `docs/api-appointments.md`, `docs/api-reference.md`.

The Appointment model FKs to `Patient` and `Staff` and records scheduled clinical encounters (date/time, status, doctor, department). It does **not** store clinical content (no notes / diagnoses / labs / billing), so no direct PHI is introduced here. The patient identity linkage is the sensitive bit.

## DPDP Act / PHI flags

- **Personal data:** patient name and DOB are accessible via the FK joins in `GET /api/appointments?patientId=...`. Existing role gates (VIEW_ROLES) apply through `requireSession()`.
- **Access control:** service layer enforces `WRITE_ROLES` for POST/PATCH and `VIEW_ROLES` for GET; audit-log writes on every mutating call (per BE-27 service module).
- **Retention:** appointment rows are persistent; no auto-purge logic introduced. Aligns with current data-retention silence — surface to Aman when full retention policy is drafted (tracked under Sprint 2 backlog).
- **No new external transfer surfaces.** No email/SMS sends, no third-party APIs.

## Recommendation

No counsel action required for merge. Advisory only. Carry forward to the weekly Aman digest if combined memo count for the week reaches 3+ (this is memo #1 of week-2 of Sprint 1).

— PM-Agent
