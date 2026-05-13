# Sprint 1 — MVP for Milestone 1 demo

**Demo target:** Thursday, **May 28, 2026** (15 days from kickoff).
**Goal:** working clinical loop, end-to-end, on the dev environment, that earns Milestone 1 payment from Dr. Yuvraaj.

## The clinical loop being demoed

**Doctor flow** (Dr. Yuvraaj logs in):
1. Login → Doctor dashboard with today's appointment list
2. Pick a patient → See full profile + history
3. Run a consultation → Write notes, attach a lab result, prescribe a treatment plan
4. Generate invoice → Mark paid → Receipt issued

**Patient flow** (a test patient logs in):
1. Self-register / login
2. Book an appointment with Dr. Yuvraaj
3. View their treatment plan + visit history
4. See invoice + payment status

If both flows work without intervention, Milestone 1 is signed off.

## Scope — Sprint 1 ships these 30 tasks

### Already shipped (8 tasks — foundation)

`BE-01` Postgres · `BE-02` Prisma · `BE-03` Core models · `BE-04` NextAuth · `BE-07` API conventions · `BE-08` Env · `BE-11` Patient CRUD · `BE-13` Consultation model

### Sprint 1 backend (12 tasks)

| ID | Task | Day target | Owner |
|---|---|---|---|
| BE-05 | OTP / password reset | 1–2 | AI |
| BE-09 | Seed data (10 patients, 3 doctors, 3 treatment plans) | 1 | AI |
| BE-12 | Department CRUD | 2 | AI |
| BE-14 | Staff/Doctor CRUD | 2 | AI |
| BE-15 | Patient search | 3 | AI |
| BE-16 | LabResult model + API | 4–5 | AI |
| BE-19 | File storage (S3 upload via presigned URL) | 5 | AI |
| BE-21 | Appointment model + slots | 6 | AI |
| BE-23 | Appointment booking endpoint | 7 | AI |
| BE-24 | TreatmentPlan model + API | 8 | AI |
| BE-26 | InfusionLog (integrative-medicine specific) | 9 | AI |
| BE-37 | Invoice model + Razorpay-mock checkout | 11 | AI |

### Sprint 1 frontend (10 tasks)

| ID | Task | Day target | Owner |
|---|---|---|---|
| FE-01 | Auth/login page + role-based redirect | 4 | Urvi |
| FE-02 | Doctor dashboard layout + nav | 5 | Urvi |
| FE-03 | Patient list with search | 6 | Urvi |
| FE-04 | Patient detail + consultation form | 7–8 | Urvi |
| FE-05 | Lab result upload + view | 9 | Urvi/Dhanjay |
| FE-06 | Patient registration page | 5 | Yasha |
| FE-07 | Patient dashboard + appointment view | 7 | Yasha |
| FE-08 | Appointment booking flow | 8–9 | Yasha |
| FE-09 | Treatment plan view (both roles) | 10 | Yasha/Dhanjay |
| FE-10 | Invoice + receipt screen | 11–12 | Dhanjay |

### Sprint 1 infrastructure (8 tasks)

| ID | Task | Day target | Owner |
|---|---|---|---|
| INF-01 | Clinic AWS account setup | 1–2 | Kunal (with clinic admin) |
| INF-02 | Terraform skeleton + state backend | 3 | Cloud Engineer → Kunal applies |
| INF-03 | VPC + subnets | 4 | Cloud Engineer → Kunal applies |
| INF-04 | RDS PostgreSQL provisioned | 5 | Cloud Engineer → Kunal applies |
| INF-05 | EC2 instance + Docker + nginx | 6 | Cloud Engineer → Kunal applies |
| INF-06 | S3 buckets (assets + PHI) | 7 | Cloud Engineer → Kunal applies |
| INF-08 | nginx HTTP reverse proxy + elastic IP (no TLS yet) | 8 | Cloud Engineer → Kunal applies |
| INF-10 | GitHub Actions deploy pipeline | 11 | Cloud Engineer → Kunal applies |

INF-07 (Secrets Manager) and INF-09 (CloudWatch alarms) are deferred to Sprint 2 — not blocking the demo.

## What's explicitly out of scope for Sprint 1

| Cut | Why | Sprint |
|---|---|---|
| Real DLT-gated SMS (use email only for demo) | DLT registration is 7-15 days, overlaps sprint | Sprint 2 |
| Real Razorpay live payments | Mock the success state; use Razorpay test mode | Sprint 2 |
| HTTPS / domain / ACM | No domain decided yet, EC2 IP access acceptable for demo | Sprint 2 |
| WhatsApp integration | Interakt approval pending | Sprint 2 |
| Multi-clinic, multi-location | Single clinic for MVP | Future |
| Admin tooling (user management UI) | Edit via direct DB for demo | Sprint 2 |
| Reports / analytics dashboards | Not in clinical-loop demo | Sprint 2 |
| Patient mobile app | Web-responsive is enough | Sprint 3+ |
| AI features (smart scheduling, treatment recommendations) | Out of MVP | Sprint 3+ |
| Inventory / pharmacy / staff payroll | Out of MVP | Future |

## Team availability

| Person | Available | Notes |
|---|---|---|
| Urvi Sharma | Day 1 → Day 15 (May 13 → May 27) | Full sprint, 12h/day |
| Yasha Sakeel | Day 1 → Day 15 (May 13 → May 27) | Full sprint, 12h/day |
| **Dhanjay** | **Day 7 → Day 15 (May 19 → May 27)** | **Unavailable Days 1-6 (May 13-18).** Joins from May 19. His scheduled Sprint 1 tasks (FE-05 Day 9, FE-09 Day 10, FE-10 Days 11-12) all fall after his return — no task reshuffling needed. |
| AI dev agents | All 15 days, 2 shifts/day (05:00 + 14:00 IST) | 4-agent morning + 2-agent afternoon |
| Cloud Engineer agent | All 15 days, 09:30 IST | Daily health check + ad-hoc INF work |
| PM Agent | All 15 days, 07:30 IST | Daily review + drafter, advisory CI gate |

**Risk:** Days 1-6 have only 2 humans (Urvi + Yasha) instead of 3. If either hits a blocker or falls sick, the buffer is thin. Mitigation: PM Agent can re-flow human tasks to AI agents for short-term coverage if needed; flag any blocker in the daily report so Kunal can intervene.

## Day-by-day timeline

| Day | Date | Milestones |
|---|---|---|
| 1 | Wed May 13 (today) | Sprint kickoff; AI shift starts on BE-05 + BE-09. Kunal coordinates with Dr. Yuvraaj for AWS account email/card. |
| 2 | Thu May 14 | INF-01 (AWS setup). AI: BE-12 + BE-14 (4 agents parallel). |
| 3 | Fri May 15 | INF-02 (Terraform skeleton). AI: BE-15 + BE-16 (start). Urvi/Yasha onboarded to sprint scope. |
| 4 | Sat May 16 | INF-03 (VPC). AI: BE-19 file storage. FE-01 (auth/login) — Urvi. |
| 5 | Sun May 17 | INF-04 (RDS). AI: BE-21 (appointment model). FE-02 (doctor layout) — Urvi. FE-06 (patient registration) — Yasha. |
| 6 | Mon May 18 | INF-05 (EC2). AI: BE-23 (appointment booking). FE-03 (patient list) — Urvi. |
| 7 | Tue May 19 | INF-06 (S3 buckets). FE-04 (patient detail + consultation) — Urvi. FE-07 (patient dashboard) — Yasha. |
| 8 | Wed May 20 | INF-08 (nginx + elastic IP). AI: BE-24 (treatment plan). FE-08 (appointment booking) — Yasha. |
| 9 | Thu May 21 | AI: BE-26 (infusion log). FE-05 (lab result UI) — Urvi/Dhanjay. **First deploy to dev EC2.** |
| 10 | Fri May 22 | FE-09 (treatment plan view) — Yasha/Dhanjay. End-to-end smoke test 1. |
| 11 | Sat May 23 | AI: BE-37 (invoice + Razorpay-mock). INF-10 (CI/CD pipeline). FE-10 (invoice screen) — Dhanjay. |
| 12 | Sun May 24 | Full clinical-loop integration test. Bug-fix day. |
| 13 | Mon May 25 | Polish: error states, loading skeletons, empty states. Bug-fix day 2. |
| 14 | Tue May 26 | Demo dry-run with Algoborne team. Final fixes. |
| 15 | Wed May 27 | Final polish + demo script prep. |
| **Demo** | **Thu May 28** | **Live demo to Dr. Yuvraaj.** Milestone 1 sign-off + invoice. |

## Capacity adjustments for Sprint 1

To hit 30 tasks in 15 days we need ~2 tasks/day average. Adjustments to existing infrastructure:

### AI dev shift — 2 → 4 parallel agents

Scheduled task `vyara-dev-shift-2300` (currently runs 05:00 IST with 2 agents) bumped to **4 agents** for the duration of Sprint 1. Same off-peak window. Watch Anthropic plan usage daily.

### Second daily dev shift at 14:00 IST

New scheduled task `algoborne-dev-shift-afternoon-1400` to give a second sweep when the token pool resets. 2 agents in the afternoon, same 4 total parallelism per 24h cycle. **Sprint-1 only — disable after demo.**

### CI gate — temporarily skipped

PM Agent's 07:30 shift normally blocks merges on the CI gate (prisma format/validate + tsc + eslint). For Sprint 1, **the gate becomes advisory**: PM merges anyway, files a follow-up issue if anything fails. This trades short-term quality for shipping velocity. Re-enable as a hard gate after demo.

Risk: bugs ship to dev that wouldn't have shipped under the gate. Mitigation: smoke tests on Day 9, Day 12, and Day 14 to catch regressions.

### Human dev hours — 10:00 to 22:00 IST

Urvi, Yasha, Dhanjay shift extends from 10:00–19:00 to **10:00–22:00 IST** for 15 days (12h/day). Not sustainable as a steady state but workable for one sprint. They get a full week off after the demo.

If anyone signals burnout mid-sprint, PM Agent re-flows their tasks to AI agents.

### Unified portal — frozen

Phase 1 of the unified-portal-consolidation plan (combining `urvi`'s and `yasha`'s separate auth/layouts into one role-routed app) is **paused until after the demo**. We keep working on the two separate portals as-is. Consolidation happens in Sprint 2 when there's room to refactor without breaking the demo.

## Demo script for May 28

Approximate 20-min walkthrough for Dr. Yuvraaj:

1. **Doctor experience (10 min)**
   - Open `http://<EC2-elastic-IP>/` on a laptop
   - Login as `dr.yuvraaj@example.com` / test password
   - Show today's appointments (3 seeded)
   - Click into a patient → see history, past consultations, lab results
   - Start a new consultation → fill in notes, attach a lab PDF, prescribe a treatment plan (3 sessions of an infusion + follow-up)
   - Generate invoice → click "mark paid" (Razorpay mock returns success) → receipt shown
2. **Patient experience (5 min)**
   - Logout, re-login as `priya.patient@example.com`
   - Show patient dashboard → upcoming appointment
   - Book a new appointment → pick slot → confirm
   - View past treatment plan + invoice
3. **What's next (5 min)**
   - Production-domain + HTTPS (Sprint 2 Day 1)
   - Real SMS + WhatsApp once DLT/WABA clear
   - HIPAA-tier BAA discussion (when revenue justifies)
   - Multi-doctor scheduling, reports, mobile app (Sprint 3+)

## What we're betting on

This sprint succeeds if four things hold:

1. **Dr. Yuvraaj or his admin is available for the INF-01 setup call this week.** If we lose more than 2 days here, infra slips and we can't deploy by Day 9.
2. **Urvi, Yasha, and Dhanjay are bought in to the 12h/day commitment.** Need them to confirm in the sprint kickoff email.
3. **The Anthropic plan supports 4 + 2 agents/day for 15 days.** I'll watch usage daily; if we trip the limit, fall back to 2 + 2.
4. **No new feature requests from Dr. Yuvraaj during the sprint.** All "just one more thing" goes to Sprint 2 — that's Kunal's job to hold the line.

If any of these slip, the demo slips proportionally. Better to slip the demo by 2-3 days than to ship a broken clinical loop.

## After the demo

- Day 16 (May 29): retrospective + capture Sprint 2 backlog from Dr. Yuvraaj's demo feedback
- Day 16: invoice for Milestone 1 (Kunal sends)
- Day 16-30: Sprint 2 — production cutover (INF-08b domain + HTTPS), full DLT-gated SMS, real Razorpay, WhatsApp Business, unified-portal consolidation, FE polish
- Day 30: production launch (or Sprint 3 if scope demands)
