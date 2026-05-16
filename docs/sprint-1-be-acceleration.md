# Sprint 1 — Backend acceleration plan (Day 4, 2026-05-16)

**Owner:** PM Agent, on direction from CEO to "speed up the backend work."
**Status:** Most acceleration already executed by the overnight AI shifts. This doc captures the new state and tees up the last gaps.

## What changed since the morning shift

Between yesterday's 14:00 IST and last night's 05:00 IST AI shifts, **6 new BE branches landed** awaiting PM review. Combined with the 5 already on main, Sprint 1 BE is effectively **10 of 12 functionally complete** (some via branch-ID drift, see mapping below).

| Plan ID | Plan task | Status | Branch | Notes |
|---|---|---|---|---|
| BE-05 | OTP / password reset | ✓ on main | task/BE-05 | — |
| BE-09 | Seed data | ✓ on main | task/BE-09 | — |
| BE-12 | Department CRUD | **✗ GAP** | none | Only true backend miss. Department model exists; no CRUD routes. Needed for FE-02 doctor dashboard nav. |
| BE-14 | Staff/Doctor CRUD | ✓ on main | task/BE-30 (drift) | — |
| BE-15 | Patient search | ✓ on main | task/BE-12 (drift) | — |
| BE-16 | LabResult model + API | ⏳ in branch | task/BE-16-lab-result-model-api **and** task/BE-16-labresult-model | **Duplicate — pick one.** `-lab-result-model-api` is more complete (978 LOC, has `docs/api-lab-results.md`); `-labresult-model` is 616 LOC, no API doc. PM picks the former at next 07:30 review and closes the latter. |
| BE-19 | File storage (S3 presigned) | ⏳ in branch | task/BE-19-file-upload-service | Unblocks FE-05 (Urvi Day 9). Merge-eligible. |
| BE-21 | Appointment model + slots | ✓ on main | task/BE-27 (drift) | Shipped Day 3. |
| BE-23 | Appointment booking endpoint | ✓ **functionally covered** by BE-21 | — | `POST /api/appointments` creates REQUESTED status. Patient-portal booking surface can use it as-is; FE-08 will wire it Day 8. No new branch needed. |
| BE-24 | TreatmentPlan model + API | ⏳ in branch | task/BE-24-treatment-plan-model | Includes sign endpoint. Merge-eligible. |
| BE-26 | InfusionLog | **✗ GAP** | none | Integrative-medicine specific. Schedule on next AI shift. |
| BE-37 | Invoice + Razorpay-mock | ⏳ in branch | task/BE-37-invoice-model | Includes Invoice + InvoiceItem + Payment models + CRUD; verify Razorpay-mock checkout at PM review. Merge-eligible. |
| (bonus) | Consultation handoff transition | ✓ in branch | task/BE-15-handoff-workflow | Not in Sprint 1 plan, but adjacent value. Merge-eligible as bonus. |

**Tally:** 5 on main + 4 distinct branches awaiting review + 1 functionally covered + 1 bonus branch = **10 of 12 done or pending review**. Remaining net work: **BE-12 (Department CRUD)** and **BE-26 (InfusionLog)**.

## Plan for the rest of Sprint 1 BE

### Shift #N+1 — today 14:00 IST (May 16)
Orchestrator brief is at `assignments/2026-05-16/orchestrator-1400.md` with full scaffold notes for both tasks.

1. **BE-12 — Department CRUD** (priority P0). Schema present; needs `app/api/departments/route.ts` + `[id]/route.ts` + service + validation. Template = `lib/services/staff.ts` (paginated CRUD, role gates, audit log, soft delete).
2. **BE-26 — InfusionLog** (priority P1). New model FKing to Patient + Consultation + Staff. Template = `lib/services/lab-result.ts` from the BE-16 branch (panel/analyte JSON, OOR flag pattern) — landed but not yet on main, point the agent at the branch.

If shift finishes early, polish-pass on audit-log coverage for the newly merged services (BE-16/19/24/37 will land at next 07:30 review).

### PM shift — tomorrow 07:30 IST (May 17)
1. Review and merge: BE-16 (pick `task/BE-16-lab-result-model-api`, close the dup), BE-19, BE-24, BE-37, BE-15-handoff.
2. Review and merge: tonight's BE-12 + BE-26 branches.
3. **Outcome:** all 12 Sprint 1 BE tasks landed on `main` by Day 5 (May 17) — 6 days ahead of the original BE-37 Day-11 target.

## Acceleration levers in play

| Lever | Status | Authority | Outcome |
|---|---|---|---|
| Re-sequence AI shifts to leverage BE-21 unlock | already executed by orchestrator overnight | PM | 6 branches in one night |
| Pre-stage orchestrator brief with scaffold notes | applied for May 16 14:00 shift | PM | ~25% expected speedup on BE-12 + BE-26 |
| Dedup BE-16 branches at next PM shift | scheduled May 17 07:30 | PM | removes 1 wasted branch from review |
| Add a 3rd daily AI shift (22:00 IST) | **not applied** — likely unnecessary now | Kunal | Would compress BE-12 + BE-26 into half a day; with only 2 tasks left, not worth the token-spend risk. **Recommend: hold.** |
| Cut BE-26 from Sprint 1 | **not applied** — not needed | CEO | InfusionLog is integrative-medicine-specific; not on demo critical path. **Recommend: keep, since shipping it on Day 4 afternoon is cheap.** |

## What this does NOT solve

FE side is unchanged. Urvi enters FE-01 build today (Day 4); Yasha FE-06 tomorrow (Day 5). The BE acceleration buys the FE devs **6 days of slack** by getting their backend dependencies onto `main` earlier than planned — that's the actual demo-readiness gain.

## Risks

- **BE-16 duplicate:** if both branches edit `prisma/schema.prisma`, picking the wrong one or merging both will conflict. Mitigated by the explicit "pick `-lab-result-model-api`" call in the May 17 PM brief.
- **Sequential-shift token budget:** the next 14:00 shift has only 2 tasks queued, well under the 10-cap.
- **Branch-ID drift:** documented in the table above and called out in the orchestrator brief. Longer-term, Kunal to decide whether to rename branches retroactively or amend `Vyara_Development_Tasks.xlsx`.

— PM-Agent (Day 4 update to the Day-3 acceleration brief)
