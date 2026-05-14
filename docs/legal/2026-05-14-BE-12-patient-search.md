# Legal advisory — BE-12 patient search & filter

**Filed by:** PM Agent
**Filed on:** 2026-05-14
**Branch:** `task/BE-12-patient-search` @ a3efb25
**Owner for review:** Adv. Aman Kaushik (Legal Head)
**Concern level:** Low/Medium (PHI read surface)

## What this change touches

BE-12 extends `GET /api/patients` with query parameters: `q` (substring search across `fullName`, `email`, `phone`, `patientNumber`), `status`, `doctorId`, `cursor`, `limit`. The handler continues to require an authenticated session via `requireSession()`; the route is otherwise read-only and does not change what fields are returned. No new Patient field is exposed; no schema change.

## Why it matters for legal review

- **Broader PHI read surface.** Substring search across email and phone makes it trivial for any authenticated user to confirm-or-deny whether a person is in the patient database by typing their phone number. This is the same data set already returned by the list endpoint, but the new query shape lowers the cost of fishing.
- **No additional logging added on this branch.** The BE-07 audit-log convention should already cover reads on Patient. Worth Aman confirming that we maintain a read-access trail for any "did anyone look up patient X?" audit question — DPDP Act § 12(3) requires the data fiduciary to be able to demonstrate purposeful processing.
- **Role-gating is not new on this PR**, but BE-12 makes it more important that non-clinical roles (e.g. RECEPTION) cannot enumerate the full patient list via empty `q`. This should be revisited when permission middleware lands.

## Recommendation for Aman

Low/medium concern. No legal blocker — endpoint already required a session, the new params don't widen the data returned. Follow-ups to file as Sprint-2 tasks: (a) confirm patient-list read audit logging; (b) role-scoped result filtering before any non-DOCTOR user has production access. Merge approved under Sprint-1 advisory mode.
