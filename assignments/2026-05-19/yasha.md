To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 7 — close FE-06/FE-07, BE-50 unlocks your dashboard

Hi Yasha,

Day 7 of Sprint 1, 9 days to demo. No `yasha/**` ref on origin overnight, so assuming FE-06/FE-07/FE-08 are still local WIP. **Day 7's master-plan target is FE-07 (patient dashboard + appointment view).** Today's headline is a big win for you: **BE-50 (patient-self read endpoints) just merged.** That's the API surface your entire patient portal consumes. No more guessing about how to scope queries to "this patient's own data" — `requirePatientSession()` does it server-side and the routes are live.

## Today's tasks (Day 7)

**1. FE-06 — patient self-registration (close out)**

Push `yasha/FE-06-patient-register` to `origin` before lunch so PM can review at the 14:00 dev-shift handoff. Spec carried over: `app/(public)/register/page.tsx`, form fields matching the `Patient` model, `POST /api/patients` → `signIn("credentials", ...)` → `/patient/dashboard`. Critical follow-up from yesterday's note: confirm the registration flow seeds the `Patient.userId` link — if `POST /api/patients` doesn't, the `/api/patient/me/*` endpoints will 403 for the new account. The BE-50 gate explicitly requires this link and surfaces a clear "no Patient row" error, so the bug will be obvious during local test.

**2. FE-07 — Patient dashboard + appointment view (today's primary, Day 7 target)**

Branch (continue `yasha/FE-07-patient-dashboard` or new off latest `main`). Now that BE-50 is live, swap any placeholder fetches to the patient-self surface:

- `app/patient/(dashboard)/dashboard/page.tsx` (server component):
  - Profile chip: `GET /api/patient/me` → name + email + phone (header band).
  - Upcoming appointments card: `GET /api/patient/me/appointments` filtered to `scheduledAt >= today` (do the filter client-side from the response; the endpoint returns the whole list). Empty state: "No appointments yet — book your first one" → CTA to `/patient/book` (FE-08).
  - Latest treatment plan summary: `GET /api/patient/me/treatment-plans` → take the most recent SIGNED plan, render header + 3 item lines, "View full plan" link to `/patient/prescriptions`.
  - Latest invoice status: `GET /api/patient/me/invoices` → most recent invoice with status pill (PAID / PENDING / OVERDUE).
  - All three cards in a stack on mobile, side-by-side on `md:`.
- `app/patient/(dashboard)/appointments/page.tsx`: full past + upcoming appointments grouped by status, hitting the same `GET /api/patient/me/appointments` endpoint. Cancel/reschedule buttons → `PATCH /api/appointments/:id` (BE-23 surface, not under `/me/*` because mutations are still on the canonical resource). Cancellation confirmation-modal-gated.
- Reuse the existing `app/patient/(dashboard)/layout.tsx` shell — header user info is dynamic already.

**3. FE-08 — Appointment booking flow (Day 8 target, primary driver for tomorrow)**

If FE-07 lands by 16:00, push hard on FE-08 today. The 3-step wizard from yesterday's spec stands: pick doctor (`GET /api/staff?role=DOCTOR`, BE-14) → pick date (HTML5 `<input type="date">`, today through +30 days) → pick slot (`GET /api/appointments/availability?staffId=&from=&to=&durationMins=30`) → submit (`POST /api/appointments/book` — no `patientId` in body, route infers from session). Spec in `docs/api-appointment-booking.md`. The 403 / 409 error handling note from yesterday still applies.

**4. Push + PM review**

- `git pull origin main` first — three new commits since yesterday: BE-25, BE-50, and the Day-7 legal memos.
- Push by EOD even if FE-08 is just Step 1. PM scans 07:30 IST tomorrow.

## What's new on `main` since yesterday

- **BE-50 patient-self read endpoints — DIRECTLY UNLOCKS FE-07.** `/api/patient/me`, `/api/patient/me/appointments`, `/api/patient/me/invoices`, `/api/patient/me/lab-results`, `/api/patient/me/treatment-plans` are all live, all read-only, all session-scoped server-side. Spec in `docs/api-patient-self.md`. You can rip out any "passing the patient id around" shims you had in FE-07 WIP — that's all done at the gate now.
- **BE-25 plan revoke + version** — `POST /api/treatment-plans/:id/{revoke,version}`. Doctor-side surface (Urvi's FE-04). For FE-07 you only need to know that a treatment plan now has a `status` of `DRAFT` / `SIGNED` / `REVOKED`; your latest-plan card should prefer the most-recent `SIGNED` row, fall back to most-recent `DRAFT` if none signed, and show REVOKED ones with a strikethrough or a clear "Revoked" tag.
- Two advisory legal memos filed (BE-25 + BE-50) — both LOW risk Sprint 1, no blocking.
- **Dhanjay nominally returns today (Day 7)** but his email is still `_email TBD_` in `docs/team.md` — I'm skipping his assignment file until that lands. Plan as if you're solo on the patient portal through end of week. Once his email is in, FE-09 (treatment-plan view) and FE-10 (invoice screen) shift to him as primary.

## Notes from PM

- **CI gate is ADVISORY** in Sprint 1 — push WIP freely. (Gate timed out on `npm install` this morning; Sprint 2 follow-up filed.)
- **BE-50 quirk to know:** the routes return `403` if the session is PATIENT-role but no `Patient.userId` link exists. That'll happen if your FE-06 registration form skipped seeding the link. Surface a friendly "Your account isn't fully set up yet — please contact the clinic" in that case rather than a raw error.
- **Tree boundaries:** you own `app/(public)/register/**`, `app/patient/**`. Urvi owns `app/admin/**` (she's on FE-04 today — patient detail + consultation form). No overlap expected.
- **API quick-ref:** the patient-self surface is read-only. For mutations (cancel appointment, etc.) keep hitting the canonical resource routes (`/api/appointments/:id` etc.) — they enforce the same session scoping internally.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
