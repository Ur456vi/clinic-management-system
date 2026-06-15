# Admin Portal — Gap Audit

Read-only audit of the admin portal (~30 pages + APIs), 13 Jun 2026. Severity:
🔴 broken / data-integrity / security · 🟠 missing feature or wrong behaviour · 🟡 polish.

> Corrections to earlier assumptions: `/api/staff` **does** exist and staff CRUD is fully wired; the **notification bell** is real and wired in both admin + patient headers. Neither is a gap.

---

## 🔴 Critical

**G1 · Patient list is a dead end.** `patients/page.tsx:62-68` — the row "View" and "Edit" menu buttons have no `onClick`/`href` and rows aren't clickable, so the fully-built patient detail/edit page is unreachable from the list.

**G2 · Patient mutate permission hole.** `app/api/patients/[id]/route.ts:28-41` — PATCH and DELETE require only a session, so *any* authenticated role can edit or archive any patient (staff & departments correctly restrict to ADMIN).

**G3 · "Mark Paid" desyncs money.** `invoices/[id]/page.tsx:179-192` + `lib/services/invoice.ts:381-396` — Mark Paid PATCHes status→PAID but records **no Payment row**. Revenue/Paid/Balance are all derived from CAPTURED payments, so a "PAID" invoice shows full Balance Due and contributes ₹0 to dashboard revenue. Status and money disagree.

**G4 · No way to record a real payment.** The `POST /api/invoices/[id]/payments` endpoint exists but has **no UI**. Only the all-or-nothing "Mark Paid" exists; no cash/card/UPI entry, no partial payments.

**G5 · Razorpay is API-only.** `app/api/payments/razorpay/{order,verify,webhook}` have **zero UI callers** — no one can trigger an online payment from the app.

**G6 · Webhook accepts forged payments if unconfigured.** `lib/services/razorpay.ts:36-58` — signature verification falls back to hardcoded `"mock-secret"`/`"mock-webhook-secret"` when env vars are unset; a misconfigured deploy lets anyone POST a "payment captured" event and mark invoices PAID. Also no replay window; books `entity.amount` from the payload.

**G7 · Four back-end areas have no admin UI:** Lab Results (`api/lab-results/*`), Infusion Logs (`api/infusion-logs/*`), Treatment Plans (`api/treatment-plans/*`, incl. sign/revoke/version), Audit Logs (`api/admin/audit-logs`). Full services + endpoints, no screen and no sidebar entry. Lab results / treatment plans are only *read-only* on the patient portal; infusion logs & audit logs have no front-end at all.

**G8 · Notification preferences are a no-op.** `api/me/notification-preferences` has a full UI + persisting API, but no send path (`lib/email.ts`, `send-confirmation`, `lib/notify.ts`) ever reads `notificationPrefs`. Toggling channels off changes nothing.

**G9 · Two money-field name bugs.** `invoices/page.tsx:275-277` reads `row.paidCents` (never serialized) → the "Paid …" sub-line never shows on partial payments. `invoices/[id]/page.tsx:60,359` renders `p.note` but the field is `notes` → payment note always "—".

---

## 🟠 Missing / wrong behaviour

- **Cancel captures no reason** (`appointments/[id]/page.tsx:248`) — always `cancelledReason = null`.
- **NO_SHOW has no UI trigger** — the status & pill exist, transition is allowed, but no button reaches it.
- **"Start appointment" offered on terminal rows** (`AppointmentsList.tsx:526-534`) — clicking on CANCELLED/COMPLETED find-or-creates a chart for a dead appointment.
- **No invoice Void / Delete / Edit-items / Refund.** `PAID → VOID` is in the transition table but no refund code exists; no `DELETE` handler on `invoices/[id]`. Mistaken invoices are permanent.
- **Reports & dashboard analytics use a 100–200 row sample** but are labelled "all-time" (`reports/page.tsx:96-99`, `dashboard/page.tsx:128-145`) → silently wrong at scale.
- **"Overdue" ignores `dueAt`** (`dashboard/page.tsx:139-143`) — uses issue-age > 30d instead of the real due date.
- **Add-wizard always reports "confirmation emails sent"** (`appointments/add/page.tsx:205`) even when the patient/doctor has no email or the call fails.
- **Auto-complete failure swallowed** (`DoctorConsultation.tsx:129-151`) — if the COMPLETED transition fails the consult saves but the appointment silently stays CONFIRMED with no feedback.
- **Confirmation email's "RMO summary" lookup misses `type: RMO` filter** (`send-confirmation/route.ts:46-50`) — can embed a MAIN consultation's sections.
- **No client-side role gating** — staff/department/invoice mutate buttons render for all viewers; non-admins get 403 toasts instead of hidden actions.
- **Assessment status PATCH is an unvalidated state machine** (`api/admin/assessment-submissions/[id]/route.ts:108`) — accepts any status (e.g. COMPLETED→REQUESTED); no audit row. List has no "Mark completed" shortcut.
- **create-invoice issues without awaiting the PATCH** (`invoices/add/page.tsx:169-175`) — on issue failure shows "Invoice created" and lands on a still-DRAFT invoice.
- **Help page dead cards** (`help/page.tsx:15-35`) — "Documentation" and "Live Chat" are styled clickable cards with no handler.
- **`MOCK_PLANS` injected** into the patient prescriptions list (`prescriptions/page.tsx:528`).
- **Orphaned `/api/patients/[id]/timeline`** — built (BE-21) but never consumed; the patient detail page rebuilds activity from `/api/appointments` instead.

---

## 🟡 Polish

- Prescription prints placeholder `KMC Reg. No.: XXXXXX` and `+91 XXXXX XXXXX` (`prescription/page.tsx:45-51`).
- Hardcoded clinic hours 09:00–18:00 (`appointments/add/page.tsx:38-41`); booking outside is impossible.
- Fragile "Yuvraaj" name-substring doctor resolution (`yuvraaj-appointments/page.tsx:34-48`).
- Kiosk renders full quiz for a bad/forbidden appointment id; only fails at submit (`kiosk/[id]/page.tsx:52-67`).
- Invoice list: DRAFT rows show "01 Jan 1970" issue date (`page.tsx:285`); "Print" prints the whole admin list, not one invoice (`:327`); no PDF export.
- **No pagination anywhere** — patients capped at 20, staff/departments/patient-picker/invoices at 100, reports at 200; `nextCursor` ignored, no load-more.
- Settings lands on a **blank pane** with no `?tab=` (`settings/page.tsx:34-37`); render-phase `router.push` for non-admin (`:55-58`); standalone `/admin/settings/email` orphaned from nav.
- Duplicate "Prefer not to say" Sex option (`ProfileSettings.tsx:555-559`); stale "stub" comments on now-implemented tabs.
- FAQ fakes an accordion (static divs with `cursor-pointer`); no dark-mode hover variant (`help/page.tsx:57-69`).
- No global search in the admin shell (removed "until the search API lands").

---

## Suggested priority order
1. **G3 + G4 + G9** — billing money integrity (record real payments; stop Mark-Paid desync; fix the two field-name bugs). Reception is already using invoices.
2. **G1 + G2** — patient list navigation + patient mutate permission gate.
3. **G6** — reject mock Razorpay secrets outside dev (security) before any deploy.
4. **G7** — decide which of lab-results / infusion / treatment-plans / audit-logs need an admin screen this milestone.
5. **G8** — wire notification prefs into the send path, or hide the toggles.
6. NO_SHOW trigger, Cancel reason, "Start appointment" status guard.
7. Analytics-at-scale (G: reports/dashboard sampling) + pagination.
