To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] DEMO DAY — Sprint 1 Day 16 (May 28) — patient flow QA + final polish

Hi Yasha,

**Today is demo day.** Dr. Yuvraaj walks through the clinical loop later today on `http://<EC2-elastic-IP>/`. The patient side of the demo is yours. No new features — push, stabilise, polish.

Overnight on `main`:
- `task/BE-09` — seed.ts expanded with lab results, treatment plans, infusion logs, paid invoices for the demo patient. Re-seed locally before testing.
- `task/BE-21` — patient-timeline service now wires LabResult + TreatmentPlan + Invoice sources. The patient dashboard / profile timeline should populate end-to-end.
- `urvi` — auth-proxy fix on assessment-booking; no regression expected on patient login.
- `infra/INF-05` — ALB + EC2 ASG module merged for the demo host.
- `task/BE-22-trend-query` (analyte trends endpoint) — REQUEST_CHANGES, stale base, conflicts in `lib/services/lab-result.ts`. Not on demo path; skip.

## Today's tasks (Day 16 — demo day)

**1. PUSH any local WIP for FE-09 / FE-10 (patient side) — FIRST THING**

`yasha/FE-09-treatment-plan-view` and `yasha/FE-10-invoice-patient` have not hit origin yet (origin still only has the long-lived `yasha` branch from Day 1). Push whatever you have, even half-done, in the first 30 minutes. I'll review and fast-merge anything that's safely scoped to the patient surface.

**2. Patient-flow dress rehearsal against latest `main`**

Pull `main`, re-run `npm run prisma:seed`. Walk the demo script as `priya.patient@example.com`:

   a. Login → patient dashboard → upcoming appointment visible
   b. Book a new appointment → pick a slot → confirm (FE-08)
   c. View past treatment plan (FE-09) — version badge + revoked-banner sanity
   d. Open invoice list → detail → if SENT show "Pay now"; if PAID show "Download receipt" stub
   e. Lab management page — verify the seeded lab PDFs render and the table sorts newest-first

Screenshot anything off and post in the eng channel. No code changes without my OK except blocker-level bugs.

**3. Razorpay-mock checkout sanity**

The mock should resolve to success and flip the invoice to PAID without redirecting off-domain. If it tries to call the real `checkout.razorpay.com` JS, gate it behind the test-mode flag.

**4. Standby for live demo support (15:00–17:00 IST)**

Stay reachable. If something breaks live and is a single-line fix, push it; otherwise we recover gracefully and file Sprint 2.

## Notes from PM

CI gate failed today across every branch on a pre-existing `prisma/schema.prisma` format issue — already filed as a Sprint 2 follow-up, no action from you. Sprint 1 advisory mode means we merged anyway.

Dhanjay still skipped on the mailer (email in `docs/team.md` is still `_email TBD_`). If he comes online today, we can hand him the lab-attach polish — for now you own the full patient surface.

— Vyara PM (autonomous agent)
