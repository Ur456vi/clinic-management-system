To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 11 — close FE-05, then admin-side of FE-10 (invoice)

Hi Urvi,

Day 11 of Sprint 1, 5 days to demo (Thu May 28). Today's master-plan headline is **FE-10 (invoice + receipt screen)** — that was originally Dhanjay's, but his email is still `_email TBD_` in `docs/team.md`, so he is not on the 09:00 mailer yet. I'm splitting FE-10 across you (admin/doctor side: create + send) and Yasha (patient side: view + pay-mock).

Backend overnight: nothing new merged on `main` since Day 9. Only one branch was open (`task/BE-22-trend-query`) and I sent it back for rebase — it was forked from a Day-6 base and its diff would have wiped out BE-25, BE-45, BE-50, BE-52 and ~40 other commits. **You do not need to touch BE-22.** AI lane will refresh and re-push. The chart placeholder on the FE-05 lab view should stay empty for one more day.

Yesterday on `main`: AI was scheduled for **BE-37 (invoice + Razorpay-mock)** — the backend that FE-10 consumes. If BE-37 doesn't land by mid-morning, build FE-10 against the spec below and stub the endpoints behind a `lib/api/client.ts` helper so swapping to the real API is a one-line change.

## Today's tasks (Day 11)

**1. FE-05 — push & close out**

If your FE-05 (lab result upload + view) branch is still local from Day 9, push `urvi/FE-05-lab-result-upload-view` to `origin` first thing. I'll review and merge before lunch. Even partial is fine — single push so it stops being invisible.

**2. FE-10 (admin side) — Invoice generate + send**

Branch off latest `main` as `urvi/FE-10-invoice-admin`. Surface lives under `/admin/(dashboard)/patients/[id]/invoices/`:

- **List** — table of the patient's invoices (most recent first): invoice number, date, amount, status (`DRAFT` / `SENT` / `PAID` / `VOID`), and a row action to view detail.
- **Create** — "New invoice" button → modal or sub-route. Pulls patient + treatment-plan context. Line items: service code (from `Department.servicePricing` JSON map — already in schema), description, qty, unit price (paise), total auto-calc. Submit → `POST /api/invoices` (BE-37). Validate non-empty line items and totals > 0 client-side.
- **Detail** — read-only view of an existing invoice with line items, totals (subtotal, tax stub, grand total in INR with paise → ₹ formatter), and two actions: "Mark as sent" (`PATCH /api/invoices/{id}` → status `SENT`) and "Send to patient" (no-op stub for now; just toast "Sent to patient portal" — the patient view is Yasha's half).
- **Empty state**: "No invoices yet — create one from a closed treatment plan."

Stub the API client if BE-37 isn't merged yet; once it lands you only flip the client. Do **not** call Razorpay directly from the admin side — payment lives in the patient portal.

**3. Spillover (only if FE-10 admin closes early)**

Polish pass on FE-04 (consultation form) error states + empty states. Day 13 is "polish" day per the sprint plan, but pulling that work forward into otherwise-idle time buys us buffer.

## How to ship

1. `git pull origin main`
2. `git checkout -b urvi/FE-10-invoice-admin`
3. Commit with `feat(FE-10): <subject>` — small, focused commits.
4. Push by 19:00 IST; I review at 07:30 tomorrow.
5. Blocker? Reply to this email.

## Notes from PM

- **CI gate is still advisory through May 28** — don't burn time chasing lint on a feature branch; ship the feature and we'll clean up Sprint 2.
- **Paise vs rupees** — store and transit everything as integer paise. Format `₹` only at render. Same convention as `Department.servicePricing`.
- **Razorpay is mocked for Sprint 1** — admin side never talks to Razorpay. Just emit `SENT` status and trust BE-37 to wire the mock.
- **No legal memo filed today** — BE-22 didn't merge, so no PHI/billing diff hit main this shift.

— Vyara PM (autonomous agent)
