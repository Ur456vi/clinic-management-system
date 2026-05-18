To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 6 — close FE-07, drive FE-08 (booking flow)

Hi Yasha,

Day 6 of Sprint 1, 10 days to demo. No `yasha/**` ref on origin overnight, so assuming FE-06/FE-07 are still local WIP. **Day 6 has no FE explicitly assigned to you in the master plan — which means today is your runway to land FE-06 + FE-07, then start FE-08 in earnest (your Day 8 target).**

Backend overnight: **BE-29 (plan → appointments)** is now merged. When a doctor signs a treatment plan, appointments are auto-created. That's mostly Urvi's surface but it affects FE-07: the patient dashboard's "upcoming appointments" list will pick up these auto-generated rows seamlessly via the same `GET /api/appointments?patientId=…` endpoint you're already wiring. No code change needed — just be aware that appointments can now appear without the patient self-booking them.

## Today's tasks (Day 6)

**1. FE-06 — patient self-registration (close out)**

Push `yasha/FE-06-patient-register` to `origin` before lunch so PM can review at the 14:00 dev-shift handoff. Spec carried over from yesterday: `app/(public)/register/page.tsx`, form fields matching the `Patient` model, `POST /api/patients` → `signIn("credentials", ...)` → `/patient/dashboard`. Confirm the patient registration auto-creates `Patient.userId` linkage — if `POST /api/patients` doesn't set it, file FE-06b as a quick follow-up and patch the body to include `userId: session.user.id` after the sign-in step.

**2. FE-07 — Patient dashboard + appointment view (close out, Day 7 target)**

Branch (continue `yasha/FE-07-patient-dashboard` or new branch off latest `main`):

- The dashboard placeholder is already on `main` at `app/patient/(dashboard)/dashboard/page.tsx` and `app/patient/(dashboard)/appointments/page.tsx` (both currently just titles + lorem text). Wire them up.
- `dashboard/page.tsx` (server component): read `getServerSession`, fetch upcoming appointments (`GET /api/appointments?patientId=<self>&from=<today>`), latest treatment plan summary, latest invoice status. Show three cards in a stack with empty states ("No appointments yet — book your first one" → CTA to `/patient/book`).
- `appointments/page.tsx` (server component): full list of past + upcoming appointments grouped by status, with cancel/reschedule buttons (use `PATCH /api/appointments/:id`). Cancellation should be confirmation-modal-gated.
- Both use the existing `app/patient/(dashboard)/layout.tsx` shell — don't rebuild it. The header user info is already dynamic (FE-01 polish landed yesterday).

**3. FE-08 — Appointment booking flow (today's primary driver, Day 8 target pulled forward)**

The BE-23 booking endpoints are merged + battle-tested. Scaffold `app/patient/(dashboard)/book/page.tsx` as a 3-step wizard (single-page, state managed locally — no need for a router):

- **Step 1 — pick doctor.** `GET /api/staff?role=DOCTOR` (BE-14). Card grid with name, department, photo placeholder. For the demo there's basically one doctor (Dr. Yuvraaj), but render the grid generically.
- **Step 2 — pick date.** Plain HTML5 `<input type="date">` is fine; constrain to today through +30 days.
- **Step 3 — pick slot.** `GET /api/appointments/availability?staffId=&from=&to=&durationMins=30` returns `{ data: [{start, end}] }`. Render as a vertical list of clickable cards.
- **Submit:** `POST /api/appointments/book` with `{ staffId, scheduledAt, durationMins: 30, reason }`. Patient self-book — do NOT pass `patientId` in body; the route infers from session. Returns `201 + appointment` on success, `403` if the patient/user link is missing (catch this and surface "Please contact the clinic — your account isn't linked to a patient record"), `409` on slot collision (re-fetch availability and prompt to pick again).

Spec in `docs/api-appointment-booking.md`.

**4. Push + PM review**

- `git pull origin main` first — five new commits since yesterday's note (BE-29, BE-41, INF-04, legal memo, FE-01 polish).
- Push by EOD even if FE-08 is just Step 1 + Step 2. PM scans 07:30 IST tomorrow.

## What's new on `main` since yesterday

- **BE-29 plan → appointments materialization** — affects how patient appointments come into existence (doctor-side, mostly), but flows into your FE-07 appointment list naturally. Spec in `docs/api-treatment-plans.md`.
- **BE-41 Razorpay mock** — `/api/payments/razorpay/{order,verify,webhook}`. This is the backend for **FE-10 (invoice + receipt screen, Day 11 target — Dhanjay's primary task when he returns)**. Not yours today, but the patient dashboard's "latest invoice status" card on FE-07 may benefit from showing payment status — link out to `/patient/invoices/[id]` (Dhanjay surface), don't try to render the Razorpay flow yourself.
- **INF-04 RDS module** — infra-only, no app impact.
- Day-6 legal memo on Razorpay-mock filed (advisory).

## Notes from PM

- **CI gate is ADVISORY** in Sprint 1 — push WIP freely. (`/tmp` permission env artifact again this morning; filed as Sprint 2 follow-up.)
- **Dhanjay returns tomorrow (May 19, Day 7).** FE-09 (Day 10) and FE-10 (Day 11) are his primary lanes; FE-05 (Day 9) is shared Urvi/Dhanjay. Plan as if you're solo on the patient portal through Day 7.
- **Tree boundaries:** you own `app/(public)/register/**`, `app/patient/**`. Urvi owns `app/admin/**`. `app/page.tsx` and `app/layout.tsx` are Urvi's via FE-01. Don't touch those.
- **403 from `/api/appointments/book`** = missing `Patient.userId` link. If you hit this during local testing, it likely means your FE-06 registration form didn't seed the link properly. Fix in the register flow first, not in the booking flow.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
