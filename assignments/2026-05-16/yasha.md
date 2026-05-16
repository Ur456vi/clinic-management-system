To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 4 — FE-06 early start (BE-side is ahead; one day pulled forward)

Hi Yasha,

Day 4 of Sprint 1, 11 days to demo. Per the original plan today is your second prep day, but **the backend is far ahead** — your FE-06 dependencies are all on `main` or landing tonight. I'm pulling FE-06 forward by one day. Build starts today, not tomorrow.

## Today's tasks (Day 4)

**1. FE-06 — patient self-registration (start build)**

Backend you can consume right now from `main`:
- `POST /api/patients` — covered by BE-11 (foundation) and extended by patient search in BE-15. Verify it accepts the self-registration shape. If it expects a staff-authenticated context only, you'll need a `POST /api/patients/register` variant — log the gap in your branch's first commit message and PM will queue it for tonight's 14:00 AI shift if needed.
- `POST /api/auth/...` — NextAuth Credentials is wired (BE-04). Post-registration auto-sign-in path: call `signIn("credentials", ...)` immediately after the registration POST succeeds.
- `prisma/schema.prisma` Patient model on `main` is the field-list source of truth. Re-verify your spec's field mapping against it before scaffolding the form.

Scaffold to add on a fresh branch `yasha/FE-06-patient-register`:
- `app/(public)/register/page.tsx` (or `app/register/page.tsx` — match whatever convention the existing `app/page.tsx` (the login page Urvi is wiring today) uses; coordinate with her on the directory choice).
- Form fields per your spec (name, DOB, gender, phone E.164, email, password + confirm, address subfields).
- Client-side validation matching server rules (Zod can be reused — but for the form layer, plain HTML5 + manual checks are fine for the first pass).
- Submit handler: `POST /api/patients` (or `/api/patients/register` if needed), then auto-sign-in, then `router.push("/patient/dashboard")`.
- Success state: redirect to `/patient/dashboard` (route won't exist yet — that's FE-07. 404 is expected; we'll wire it together at Day 7).
- Error states: duplicate email/phone (409), validation error (422), server error (5xx). Mirror Urvi's error-pattern from `app/page.tsx`.

**2. Patient-portal scaffolding (FE-07 prep)**

In the same `yasha/FE-06-patient-register` branch:
- `app/patient/layout.tsx` — minimal nav (logo, "My appointments", "My treatment plan", "Invoices", "Logout"). No styling polish; structure first.
- `app/patient/dashboard/page.tsx` — placeholder that says "Welcome, {name}. Your upcoming appointments will show here." Read session via `getServerSession`.

This gets the patient-portal directory tree onto `main` so FE-07 / FE-08 builds straight on top of it.

**3. Branch + push**

- `git pull origin main` first.
- Commit-by-section: registration page, validation, submit + sign-in flow, patient layout, dashboard placeholder.
- Push before EOD even if not feature-complete. PM at 07:30 IST tomorrow.

## Branches & main updates I'm aware of

- **On `main` now:** Sprint 1 BE acceleration plan (`docs/sprint-1-be-acceleration.md`), today's 14:00 AI shift brief, legal memo, Day-3 assignment record.
- **AI shift today 14:00 IST:** BE-12 (Department CRUD) + BE-26 (InfusionLog). Backend-only, no FE collision.
- **Pending PM review tomorrow:** BE-16 LabResult, BE-19 S3 upload, BE-24 TreatmentPlan, BE-37 Invoice/Payment. After they land tomorrow morning, FE-07 (Day 7), FE-08 (Day 8), FE-09 (Day 10), FE-10 (Dhanjay's) all have full backend coverage well in advance.
- **Coordinate with Urvi today:** she's wiring `signIn` on `app/page.tsx` in `urvi/FE-01-auth-login`. Don't conflict on `app/page.tsx` or `app/layout.tsx`. Your registration page should live elsewhere; pick the path early and tell her.

## Notes from PM

- **CI gate is ADVISORY** in Sprint 1; push WIP freely.
- **Dhanjay back May 19.** FE-09 (Day 10) still assumes solo for now.
- **You just gained a day.** Spec work from Day 2–3 should make today mostly execution. If FE-06 + layout scaffolding land by EOD, tomorrow (Day 5) you can either jump-start FE-07 (patient dashboard with the appointment list — fully backend-ready now) or help Urvi on FE-02 dashboard layout — your call, but I'd lean toward FE-07 because it's solo-owned and a long-pole item.
- Use Swagger UI at `/swagger` (live since yesterday) to validate the patient-create payload shape before you write the form's submit handler.

Reply with blockers — PM picks them up at 07:30 tomorrow.

— Vyara PM (autonomous agent)
