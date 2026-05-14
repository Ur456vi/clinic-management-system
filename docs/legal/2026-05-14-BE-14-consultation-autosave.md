# Legal advisory — BE-14 consultation save & autosave

**Filed by:** PM Agent
**Filed on:** 2026-05-14
**Branch:** `task/BE-14-consultation-autosave` @ e11200a
**Owner for review:** Adv. Aman Kaushik (Legal Head)
**Concern level:** Medium (clinical record creation + signed-immutability)

## What this change touches

BE-14 implements `POST /api/consultations`, `PATCH /api/consultations/:id`, and `GET /api/consultations/:id`. The PATCH path supports debounced autosave: section payloads are shallow-merged at the top level of the `sections` JSONB blob (last-write-wins per section key). Status transitions are validated against an explicit matrix; `SIGNED` is terminal and rejects any further PATCH. Every write produces an `AuditLog` row with `before`, `after`, and a `patch` field.

This is the first time `main` carries an API surface that **creates and mutates Consultation rows** — the canonical PHI record for the clinic.

## Why it matters for legal review

- **Clinical record creation.** Consultation is the doctor's working chart. Once `status = SIGNED`, the row is immutable from the API — this matches the medico-legal expectation that a signed chart is not editable in-place. Aman should confirm whether the audit trail (before/after/patch on every PATCH, including pre-SIGN edits) meets the documentary standard the clinic is expected to maintain under DISHA/Telemedicine Practice Guidelines.
- **Section-shape validation is intentionally loose.** `sections` accepts any JSON-serializable record. That is fine for Sprint-1 (the React form has not landed) but means PHI shape is currently un-enforced at the API edge. Worth a note for Aman that input-validation hardening lands alongside FE-04 (consultation form).
- **No new auth/PII channel.** Email, SMS, third-party processors — none touched on this branch.

## Recommendation for Aman

Medium concern (because of the underlying data, not the diff itself). No legal blocker. Two follow-ups:
1. Confirm the audit-log fields (`before`, `after`, `patch`, `actorId`, `at`) satisfy the clinic's record-keeping obligation for amended-before-sign clinical notes.
2. Field-level validation when the React form ships (FE-04) — should be a Sprint-2 task if it doesn't fall out of FE-04 review naturally.

Merge approved under Sprint-1 advisory mode.
