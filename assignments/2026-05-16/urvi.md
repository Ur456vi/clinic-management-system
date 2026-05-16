To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 4 — FE-01 build day (auth/login + role-based redirect)

Hi Urvi,

Day 4 of Sprint 1, 11 days to demo. **This is your first build day.** Spec from Days 2–3 should be implementation-ready; today is pure execution on **FE-01 — auth/login + role-based redirect**.

Heads-up before you branch: the backend is **way ahead** of the original plan. Five Sprint 1 BE tasks shipped (auth, seed, staff CRUD, patient search, appointments) and four more are in branch awaiting tomorrow's PM review (LabResult, S3 upload, TreatmentPlan, Invoice/Payment). Your FE pipeline through Day 9 will not be backend-blocked.

## Today's tasks (Day 4)

**1. FE-01 — auth/login + role-based redirect (full ship)**

Current state on `main`:
- `app/page.tsx` is the login UI skeleton (the stub Kunal wrote). Email + password + show-password toggle, hardcoded redirect to `/admin/patients`.
- `app/admin/auth/login/page.tsx` is an empty stub (`return null`). Probably delete or repurpose for re-auth flows.
- `middleware.ts` already enforces `/admin/**` (staff roles) and `/patient/**` (PATIENT role), redirects on mismatch. Reads NextAuth JWT at the edge.

What FE-01 needs to add:
- Replace the hardcoded `router.push("/admin/patients")` in `app/page.tsx` with a real `signIn("credentials", { email, password, redirect: false })` call.
- On success, read the resulting session role and redirect:
  - `ADMIN | DOCTOR | RMO | RECEPTION | INFUSION_SPECIALIST | REHAB_SPECIALIST | AESTHETICS_SPECIALIST` → `/admin/dashboard` (or fall back to `/admin/patients` if dashboard doesn't exist yet — Yasha and you will share FE-02 layout work tomorrow).
  - `PATIENT` → `/patient/dashboard` (page won't exist until Yasha ships FE-06/FE-07; 404 is expected and acceptable today).
- On failure, surface error: invalid credentials, account locked, server error. Reuse Tailwind utility classes already in `app/page.tsx`; no new shadcn components needed yet.
- "Forgot password?" link → `/admin/auth/password-reset` (route doesn't exist yet; BE-05 on main has the endpoints — `POST /api/auth/password-reset/{request,verify,confirm}` — so leave the link as a stub `<Link>` for now and file FE-01b for the form, or just open this as a follow-up).

**2. Login-page polish (within FE-01 scope)**

- Loading state on the button (disable + spinner) while `signIn` is in-flight.
- Email validation on submit (HTML5 + basic format check).
- Password min-length client check matching the BE rule (read `lib/validation/password-reset.ts` for the canonical rule — at least 8 chars).
- Empty-state error message styling — use the existing Tailwind colour palette in `app/globals.css`.

**3. Branch + push**

- `git pull origin main` first — there are 3 new merges since yesterday's note (BE acceleration plan, the Day-3 assignments, and a legal memo). Yesterday's docs talked about 5 backend merges; those are already on `main`.
- `git checkout -b urvi/FE-01-auth-login`.
- Commit-by-section: one commit for the signIn wiring, one for redirect logic, one for error/loading states, one for any cleanup.
- Push before EOD even if not feature-complete — PM scans at 07:30 IST tomorrow.

**4. Stretch — FE-02 layout sketch (optional, only if FE-01 lands by 16:00)**

- Read `docs/api-staff.md` and `docs/api-appointments.md` on `main` (just landed yesterday).
- Sketch `app/admin/(dashboard)/page.tsx` — today's appointment list widget, quick-actions, recent-patients. ASCII or low-fi screenshot in a `urvi` WIP commit. Do NOT scaffold the actual page — that's tomorrow.

## Branches & main updates I'm aware of

- **On `main` now (since your last pull):** Sprint 1 BE acceleration plan (`docs/sprint-1-be-acceleration.md`), today's 14:00 AI shift brief (`assignments/2026-05-16/orchestrator-1400.md`), legal memo for BE-27, Day-3 assignment record.
- **AI shift today 14:00 IST:** BE-12 (Department CRUD) and BE-26 (InfusionLog). Both backend-only — zero FE collision. They'll edit `app/api/departments/**`, `app/api/infusion-logs/**`, `prisma/schema.prisma`, `lib/services/**`, `lib/validation/**`. **Avoid editing those paths.** You shouldn't need to touch them anyway for FE-01.
- **Pending PM review tomorrow morning:** BE-16 LabResult (×2, will dedupe to `task/BE-16-lab-result-model-api`), BE-19 S3 upload, BE-24 TreatmentPlan, BE-37 Invoice/Payment. These unblock FE-05 (Day 9) and FE-10 (Dhanjay's, Day 11) ahead of schedule.

## Notes from PM

- **CI gate is ADVISORY** through Sprint 1. Push WIP freely; the lint/typecheck status doesn't block your merge.
- **Dhanjay back May 19** (Day 7). FE-05 (Day 9) shared with him — still assume solo.
- **You're cleared to start FE-02 on Day 5 (tomorrow)** with full BE-side data — Staff CRUD, Patient search, Appointment list, Department CRUD (landing tonight) are all on main. The doctor dashboard will be ~80% backend-ready when you start it.
- Swagger UI is live at `/swagger` (BE-56 merge yesterday). Use it as an interactive API reference while wiring `signIn` and any next-screen fetches.

Reply with blockers — PM picks them up at 07:30 tomorrow.

— Vyara PM (autonomous agent)

---

## 07:30 PM-Agent addendum (post-merge)

Since this brief was drafted, the 07:30 PM Agent shift merged the four "pending tomorrow" BE branches into `main`. As of `main` HEAD `63f0533`:

- BE-16 LabResult model + API → MERGED. Endpoints: `GET/POST /api/lab-results`, `GET/PATCH /api/lab-results/:id`. Schema in `prisma/schema.prisma`. Will matter for FE-05 (Day 9), but not today.
- BE-19 S3 presigned upload/download → MERGED. `POST /api/files/upload-url`, `POST /api/files/download-url`. Same — Day 9 dependency, not today.
- BE-24 TreatmentPlan model + API + sign endpoint → MERGED. `app/api/treatment-plans/**`. Day 8/10 dependency.
- BE-37 Invoice + InvoiceItem + Payment models + CRUD → MERGED. Day 11+ dependency.
- BE-15 consultation handoff transition → MERGED. Will matter when you wire the consultation form (Day 7-8).
- BE-21 patient timeline endpoint → MERGED. `GET /api/patients/:id/timeline`. Pulls Day-5 FE-02 work forward — show a recent-activity rail on the doctor dashboard if you have time.
- BE-31 department CRUD with default pricing → MERGED. Nothing for you today.
- INF-03 VPC + 2-AZ subnets → MERGED.

**Today's work doesn't change.** `git pull origin main` before you branch so you don't start off `b1b0a1f`.

PM-Agent
