# Sprint 1 — Backend acceleration plan (filed 2026-05-15 Day 3)

**Owner:** PM Agent, on direction from CEO to "speed up the backend work."
**Status:** PM-authority items applied; CEO/PM-human approval items flagged.

## Where we are (end of Day 3 morning)

5 of 12 Sprint 1 backend tasks shipped (~42%). 7 pending in 12 calendar days. Stock pace = 7 / 12 days = **0.58 tasks/day**, which leaves zero buffer for the polish-and-bugfix window (Days 12–15).

| Plan ID | Task | Status | Branch (drift note) |
|---|---|---|---|
| BE-05 | OTP / password reset | ✓ shipped | task/BE-05 |
| BE-09 | Seed data | ✓ shipped | task/BE-09 |
| BE-14 | Staff/Doctor CRUD | ✓ shipped today | task/BE-30 (branch ID drift) |
| BE-15 | Patient search | ✓ shipped | task/BE-12 (branch ID drift) |
| BE-21 | Appointment model + slots | ✓ shipped today, **5 days ahead** | task/BE-27 (branch ID drift) |
| BE-12 | Department CRUD | ✗ pending (was Day-2 target — slipping) | — |
| BE-16 | LabResult model + API | ✗ pending | — |
| BE-19 | File storage (S3 presigned URL) | ✗ pending | — |
| BE-23 | Appointment booking endpoint | ✗ pending (**now unblocked early** by BE-21) | — |
| BE-24 | TreatmentPlan model + API | ✗ pending | — |
| BE-26 | InfusionLog | ✗ pending | — |
| BE-37 | Invoice + Razorpay-mock | ✗ pending | — |

**Branch-ID drift note for Kunal:** the orchestrator and AI agents have been picking branch IDs from the wider `Vyara_Development_Tasks.xlsx` numbering, not the Sprint 1 plan IDs. This is cosmetic — the functionality matches — but it's why "BE-30 staff CRUD" satisfies plan row "BE-14 Staff/Doctor CRUD." Next-shift orchestrator brief includes a mapping table to keep this from confusing the daily reports.

## Acceleration levers (3 of them, ranked by ROI)

### 1. Re-sequence the next 4 AI shifts (PM authority — applied)

The BE-21 early-ship unlocks BE-23 (booking endpoint) and BE-26 (InfusionLog FKs to Appointment) earlier than the plan assumed. New backlog order for the orchestrator, optimized for unblocking the FE side:

| Shift | Date / time IST | Tasks (in spawn order) | Rationale |
|---|---|---|---|
| **#5** | Fri May 15 14:00 | BE-12 (Department CRUD), BE-23 (Appointment booking), BE-16 (LabResult model+API) | BE-12 clears Day-2 slip; BE-23 unblocked by BE-21 ship-early; BE-16 starts the lab loop one day early. |
| **#6** | Sat May 16 05:00 | BE-19 (S3 presigned URL), BE-24 (TreatmentPlan), BE-26 (InfusionLog) | BE-19 unblocks FE-05 lab upload (Urvi Day 9); BE-24 + BE-26 are independent and parallel-safe within the sequential-shift model. |
| **#7** | Sat May 16 14:00 | BE-37 (Invoice + Razorpay-mock), buffer / polish | Last BE task. If finished early, polish pass on auth + audit logs. |
| **#8** | Sun May 17 05:00 | **All Sprint 1 BE complete by here.** Buffer for AI dev shift to chase FE bug-fixes, write integration tests, or pick up Sprint-2 prefetch. | — |

**Outcome if executed:** 12/12 Sprint 1 BE done by **end of Day 5** (May 17) — 6 days ahead of the latest BE plan target (Day 11 for BE-37). That returns ~6 dev-days of slack to the demo-readiness window.

### 2. Pre-stage scaffold notes for the next AI shift (PM authority — applied)

The single biggest waste in the AI shift is the agent rediscovering the codebase. The orchestrator brief at `assignments/2026-05-15/orchestrator-1400.md` ships with:

- Exact files to read first (and which to skip).
- Schema delta required for each task (prisma fields, enums, indexes).
- Existing service-layer patterns to copy (point at `lib/services/appointment.ts` from BE-27 as the canonical template).
- API-shape sketches (request/response JSON) so the agent doesn't reinvent.

This isn't speeding up the work itself — it's removing the warm-up cost of each new task. Expected saving: 20–30% per task; sequential model means that compounds across the 7 remaining tasks.

### 3. Cadence + scope decisions (CEO / Kunal approval needed)

These were considered but **not applied** by the PM Agent — they cross authority lines:

- **Adding a third daily AI shift (e.g., 22:00 IST).** Would compress the 4-shift plan above into 2 calendar days. **Cost:** roughly 1.5× current Anthropic token spend; the parallel-model abort on Day 2 (per `docs/org-policy.md`) is the cautionary tale. **Recommend:** approve only if shifts #5 and #6 above don't both finish all assigned tasks.
- **Cutting BE-26 (InfusionLog) from Sprint 1.** Integrative-medicine-specific; not on the critical path for the clinical-loop demo. Trading it out frees one shift slot. **Recommend:** keep in; the early sequencing above ships it on Day 4 anyway.
- **Razorpay-mock vs. just-paid-flag for BE-37.** Plan already specifies the mock. If the implementation drags, falling back to a "Mark Paid" button without the Razorpay test-mode flow is acceptable for the May 28 demo. **Recommend:** defer the decision until BE-37 lands — keep the agent on the full mock until proven blocking.

## Risks

- **Sequential-shift token budget.** The 10-task-per-shift cap exists for a reason. The new sequence asks for 3 tasks per shift (well under the cap), but the 14:00 shift today is the first real stress test of the sequential model with a non-trivial backlog. If it stalls mid-shift, branches don't roll back — PM picks them up at 07:30 tomorrow and the schedule slips by half a day, not a full day.
- **Branch-ID drift compounds reporting confusion.** Adding a mapping table to the orchestrator brief; longer-term Kunal should decide whether to rename branches retroactively or amend `Vyara_Development_Tasks.xlsx` to match.
- **No FE side is being accelerated here.** Urvi enters her first build day tomorrow on FE-01; FE-06 (Yasha) Day 5. The BE acceleration doesn't help FE unless we redirect AI capacity to FE — which the agents aren't currently tuned for. Out of scope of this plan.

## Sprint 2 follow-up filed alongside

- npm-cache `ENOTCACHED` failure in PM CI gate (filed earlier today; carry into Sprint 2 retro).
- Branch-ID-to-plan-ID mapping doc.
- Decide whether to keep the orchestrator-brief pre-staging as a permanent PM-shift artifact.

— PM-Agent (07:30 shift, Day 3)
