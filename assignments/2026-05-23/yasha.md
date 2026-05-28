To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 11 — close FE-09, then patient side of FE-10 (invoice + Razorpay-mock)

Hi Yasha,

Day 11 of Sprint 1, 5 days to demo (Thu May 28). Today's headline is **FE-10 (invoice + receipt screen)** — originally Dhanjay's task, but his email is still TBD in `docs/team.md`. So FE-10 is split: Urvi takes the admin/doctor side (create + send invoices) and you take the **patient side** (view + Razorpay-mock checkout).

Backend overnight: nothing new merged on `main` since Day 9 — the only open branch, `task/BE-22-trend-query`, was returned for rebase (stale base, would have wiped recent work). No CSRF/CORS surprises on you today. **BE-37 (invoice + Razorpay-mock)** is the AI lane target today; if it doesn't land by mid-morning, build against the spec below and stub the API client so the swap is trivial.

No `yasha/**` ref hit origin since the FE-09 head-start on Day 9 — please push it this morning before starting FE-10. Even half-done is fine.

## Today's tasks (Day 11)

**1. FE-09 — push & close out**

Push `yasha/FE-09-treatment-plan-view` to `origin` first thing. Confirm the version badge + revoked banner from the Day 9 spec are in. I'll review and merge before lunch.

**2. FE-10 (patient side) — Invoice view + Razorpay-mock checkout**

Branch off latest `main` as `yasha/FE-10-invoice-patient`. Lives under `/patient/(dashboard)/invoices/`:

- **List** — reads `GET /api/patient/me/invoices` (BE-50 — already on main since Day 7). Show invoice number, issued date, amount (paise → `₹` formatter), status (`SENT` / `PAID` / `VOID`). Sort newest first. Action: "View" → detail.
- **Detail** — `/patient/(dashboard)/invoices/[id]`. Header (number, date, status), line items table (description / qty / unit price / line total), totals block (subtotal, tax stub, grand total). If `SENT` and unpaid, show a primary "Pay now" button. If `PAID`, show a "Download receipt" affordance (stub for now — just trigger a print-view; receipt PDF is a Sprint 2 nice-to-have).
- **Razorpay-mock checkout flow** — clicking "Pay now":
  - `POST /api/invoices/{id}/checkout` (BE-37 — provides a mock order ID + amount).
  - Open the Razorpay JS checkout in **test mode** with the mock key. Use the official `https://checkout.razorpay.com/v1/checkout.js` script.
  - On the Razorpay `handler` callback (success), `POST /api/invoices/{id}/payment` with the mock `razorpay_payment_id` — backend flips status to `PAID`.
  - On dismiss/failure, no-op + friendly toast ("Payment cancelled — your invoice is still open").
  - After success, refresh the detail view; the page should now show `PAID` + "Download receipt".
- **Empty state** — "No invoices yet" with a hint about post-consultation billing.

If BE-37 isn't on `main` by mid-morning, stub the two POST endpoints behind `lib/api/client.ts` so the swap is one line later.

**3. Stretch (only if FE-10 patient closes early)**

A small polish pass on FE-07 (patient dashboard) — make sure the "Latest invoice" tile (if you have one) links to the new invoice list. Otherwise add it.

## How to ship

1. `git pull origin main`
2. `git checkout -b yasha/FE-10-invoice-patient`
3. Commit with `feat(FE-10): <subject>` — small, focused commits.
4. Push by 19:00 IST; I review at 07:30 tomorrow.
5. Blocker? Reply to this email.

## Notes from PM

- **CI gate is still advisory through May 28** — ship the feature, don't chase lint on a branch.
- **Razorpay test mode only** — never paste a live key. The mock key lives in `.env.example` (or will after BE-37). Treat the integration as best-effort UI for the demo; the real Razorpay flow is a Phase-2 task.
- **Paise convention** — all amounts in integer paise. Format `₹` at the render boundary only.
- **No CSRF/CORS gotchas today** — you're same-origin under `/patient/**`, the BE-52 guard is invisible to you.
- **Day 12 (tomorrow)** is the full clinical-loop integration test — your register → book → view plan → view invoice → pay flow is the demo's second half. Anything you ship to "happy path works" today is worth its weight tomorrow.

— Vyara PM (autonomous agent)
