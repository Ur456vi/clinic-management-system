# Advisory legal memo — BE-50 Patient-self read endpoints

**Date:** 2026-05-19 (Sprint 1 Day 7)
**Branch:** `task/BE-50-patient-self-read-endpoints` → merged into `main` this shift
**Reviewer:** PM-Agent (advisory only, non-blocking)
**Cc:** Adv. Aman Kaushik <amankaushik39@gmail.com> (no action required unless ≥3 memos accumulate this week)

## Scope of change

Adds the patient-portal self-read surface under `/api/patient/me/*`:

- `GET /api/patient/me` — own profile
- `GET /api/patient/me/appointments` — own appointments
- `GET /api/patient/me/invoices` — own invoices
- `GET /api/patient/me/lab-results` — own lab results
- `GET /api/patient/me/treatment-plans` — own treatment plans
- `lib/api/patient-session.ts` — `requirePatientSession()` helper (auth + role + Patient-link gate)
- `lib/services/patient-self.ts` — read-only service methods scoped by `patientId` from session
- `docs/api-patient-self.md` — public API reference

## Surfaces touched (advisory triggers)

- **Patient-facing read of own clinical + billing data** — PHI (lab results, treatment plans), billing (invoices), and identity (profile). High-sensitivity surface, even though strictly read-only.

## Sprint-1 posture

- **Read-only by design.** No POST/PATCH/DELETE in this branch. Patient cannot modify their own clinical record from the portal.
- **Scope enforced server-side.** `requirePatientSession()` resolves `{ userId, patientId }` from the session and ALL queries hard-pin to that `patientId`. The handlers never accept a `patientId` query parameter — eliminates IDOR-by-construction.
- **Three-layer gate:** (1) session present (401 else), (2) role = PATIENT (403 else — clinic staff explicitly rejected from these endpoints), (3) `Patient.userId` link exists (403 else, with clear message).
- **No PII export surface.** Responses return the patient's own records only. No third-party sharing, no batch export.

## Risk classification

**LOW (Sprint 1)** — patient seeing their own data is the textbook "data principal right of access" use case under DPDP §11 and a baseline DISHA expectation. Server-side scoping is the canonical pattern. No new model fields, no new external data flow.

**MEDIUM (Sprint 2 cutover):**
1. **Rate-limiting** — these endpoints will be hit on every patient-portal page load. Add per-session rate limit before public exposure (INF / middleware work, not BE-50).
2. **Audit logging on read?** — current audit log captures mutations. Decide with Aman whether patient self-reads of their own PHI need an audit row for DISHA traceability or whether session-log + access-log at the nginx tier is sufficient.
3. **Field-level redaction** — confirm with Aman whether any TreatmentPlan/LabResult fields should be doctor-only and excluded from the patient view (e.g. internal clinical notes vs. patient-facing summary).

## Action

None blocking. Memo on file for the week's running total. Running count this week: 2 memos (BE-25 + BE-50) — still under the 3-memo Aman-ping threshold.
