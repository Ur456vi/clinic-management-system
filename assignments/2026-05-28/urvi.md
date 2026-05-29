To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] DEMO DAY — Sprint 1 Day 16 (May 28) — doctor flow QA + final polish

Hi Urvi,

**Today is demo day.** Dr. Yuvraaj walks through the clinical loop on `http://<EC2-elastic-IP>/` later today. The whole sprint comes down to this one walkthrough. No new features — only stabilise, polish, and push anything still local.

Overnight on `main`:
- Your `urvi` branch (assessment-booking email logger + `proxy.ts` public-auth bypass) merged at 07:30. Verify it didn't regress the doctor-login redirect.
- `infra/INF-05` — ALB + EC2 ASG web tier module landed; Kunal will apply terraform before demo time.
- `task/BE-09` (clinical seed expansion) and `task/BE-21` (timeline wires LabResult + TreatmentPlan + Invoice sources) merged — the patient profile timeline should now light up end-to-end with seeded data.
- `task/BE-22-trend-query` is still REQUEST_CHANGES (stale Day-6 base, conflicts in `lib/services/lab-result.ts`). Not on the demo path — ignore.

Filed advisory legal memo `docs/legal/2026-05-28-urvi.md` for your auth-proxy change (informational, non-blocking).

## Today's tasks (Day 16 — demo day)

**1. PUSH any local WIP for FE-05 / FE-10 (doctor side) — FIRST THING**

If any of `urvi/FE-05-*` or `urvi/FE-10-invoice-admin` is still local from Days 9-11, push it now even half-done. Better a stub in the demo than a missing screen at 11:30.

**2. Doctor-flow dress rehearsal against latest `main`**

Pull `main`, run `npm run prisma:migrate dev && npm run prisma:seed` (BE-09 expanded the seed — fresh data). Then walk through the demo script end-to-end on your laptop as `dr.yuvraaj@example.com`:

   a. Login → admin dashboard → today's appointments shows the 3 seeded
   b. Click a patient (Priya) → profile loads → timeline now shows lab results + treatment plans + invoices (new on `main` as of today — eyeball spacing/sort order)
   c. New consultation → notes + lab PDF attach + treatment plan with 3-session infusion
   d. Invoice generate → mark paid (Razorpay mock) → receipt view

For each step, screenshot any visual jank, broken icon, off-by-one, or unreadable contrast and post in the eng channel. No fixes without my OK — we're freezing the surface; only blocker-level bugs get patched today.

**3. Bug-bash: prescription detail "logged-in patient" regression**

BUG-002 ("use logged-in patient's own data in prescription detail view") landed on main on Day 15. Verify in the doctor portal that opening a patient's prescription detail still shows that patient's data, not the doctor's — same risk surface. 10-min sanity check; flag anything off.

**4. Standby for live demo support (15:00–17:00 IST)**

Stay reachable on Slack during the demo window. If something breaks live and is a single-line fix, you push it; otherwise we recover gracefully and file Sprint 2.

## Notes from PM

We made it to Day 16. CI gate failed today on a pre-existing `prisma/schema.prisma` format issue across all branches — that's a Sprint 2 follow-up (file: "Run npm run prisma:format on main"), not yours. Sprint 1 mode merged anyway as planned.

Dhanjay is still skipped on the mailer — email in `docs/team.md` is still `_email TBD_`. Please ping Kunal once more today; if it comes in he can pick up live demo support too.

— Vyara PM (autonomous agent)
