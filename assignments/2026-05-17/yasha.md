To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 5 — finish FE-06, start FE-07 (Patient dashboard)

Hi Yasha,

Day 5 of Sprint 1, 11 days to demo. No `yasha/**` branch hit `origin` yesterday — assuming FE-06 is local-only WIP. Plan today: **close out FE-06, then pivot to FE-07 (Day 7 sprint target, pulled forward).**

Backend now includes the **appointment booking endpoint (BE-23)** which was merged this morning — that's your FE-08 dependency landing two days ahead of schedule. FE-07 → FE-08 are now a continuous flow you can build without backend waits.

## Today's tasks (Day 5)

**1. FE-06 — patient self-registration (close out)**

Push `yasha/FE-06-patient-register` to `origin` before lunch so PM can review at 14:00. Carry over:
- `app/(public)/register/page.tsx` (or wherever you put it — confirm with Urvi so it doesn't collide with FE-01).
- Form with name/DOB/gender/phone/email/password matching `Patient` model fields on main.
- `POST /api/patients` then `signIn("credentials", ...)` then redirect to `/patient/dashboard`.
- Error states for 409 / 422 / 5xx.

**2. FE-07 — Patient dashboard + appointment view (Day 5 + Day 7 target, pull forward)**

Branch (same branch or new `yasha/FE-07-patient-dashboard`):

- `app/patient/layout.tsx` — patient-portal shell. Top bar with name + sign-out, side-nav (My appointments, My treatment plan, Invoices). Plain Tailwind, no shadcn polish today.
- `app/patient/dashboard/page.tsx` — server component, reads `getServerSession`, fetches:
  - Upcoming appointments: `GET /api/appointments?patientId=<self>&from=<today>` (the existing endpoint; the patient-scoped variant — verify it filters by session patient or open a follow-up).
  - Latest treatment plan: `GET /api/patients/:id/treatment-plans?limit=1` if available, else show "no active plan yet" empty state.
- **Empty states matter** — first-time patient hits an empty dashboard. Use friendly copy ("No appointments yet — book your first one").

**3. FE-08 prep — Appointment booking flow (today's stretch, Day 8 target normally)**

The BE-23 endpoints merged this morning unblock FE-08 entirely. If FE-07 lands by 16:00, scaffold:
- `app/patient/book/page.tsx` — three-step flow: pick doctor → pick date → pick slot.
- Step 1: `GET /api/staff?role=DOCTOR` (BE-14 endpoint).
- Step 2: date picker (HTML5 `<input type="date">` is fine for the demo).
- Step 3: `GET /api/appointments/availability?staffId=&from=&to=&durationMins=30` returns `{data: [{start, end}, ...]}`.
- Submit: `POST /api/appointments/book` with `{staffId, scheduledAt, durationMins, reason}` — patient self-book branch (no `patientId` in body). Returns `201 + appointment` or `403` if patient/user not linked.

Don't worry about styling polish today — wire the flow.

**4. Push + PM review**

- `git pull origin main` first — BE-23 booking, BE-26 infusion-log, Day-5 legal memos.
- Push by EOD even if FE-07 is just the layout + dashboard placeholder.

## What's new on `main` since yesterday

- **BE-23 appointment booking** — full spec in `docs/api-appointment-booking.md`. This is **your FE-08 backend** landing early. See above.
- **BE-26 infusion log** — clinical side, mostly out of your scope for now. Patients can read their own logs via `GET /api/infusion-logs?patientId=<self>` when FE-09 (treatment plan view) lands.
- Two Day-5 legal advisory memos in `docs/legal/`.

## Notes from PM

- **CI gate is ADVISORY** in Sprint 1 — push WIP freely. (Sandbox /tmp issue this morning was env, not code — Sprint 2 follow-up.)
- **Dhanjay back May 19.** FE-09 (Day 10) shared with him; for now assume solo.
- **Coordinate with Urvi on shared paths** — she's in `app/admin/(dashboard)/**`, you're in `app/(public)/register/` + `app/patient/**`. No overlap expected. `app/page.tsx` and `app/layout.tsx` are hers for FE-01.
- The patient self-book endpoint REQUIRES `Patient.userId` link. Your FE-06 registration flow needs to ensure this link is created — the `POST /api/patients` body should let you set `userId` either explicitly or via the auto-sign-in flow. Double-check this by hitting the endpoint via Swagger UI before wiring the form submit handler. If the link isn't auto-created, file FE-06b as a quick follow-up.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
