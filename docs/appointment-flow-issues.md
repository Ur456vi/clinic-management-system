# Issue List — Assessment → Booking → RMO → Doctor → Prescription Flow

Observed during the manual E2E run on 12–13 Jun 2026 (local dev). Severity:
🔴 functional bug · 🟠 flow/UX gap · 🟡 polish/decision needed.

## Functional bugs

**ISS-01 ✅ FIXED — "View quiz Assessment" kebab action does nothing**
Root cause: the kebab menu closes on any scroll (capture listener); when the last menu items rendered below the viewport fold, scrolling them into view closed the menu before the click landed. Fix: menu now flips upward when it would spill past the bottom of the viewport, so every item stays visible without scrolling. Verified: kebab → View quiz Assessment navigates to the quiz page.
*Fixed in:* `components/admin/AppointmentsList.tsx` (`toggle()` flip-up positioning).

**ISS-02 ✅ FIXED — Dashboard "Revenue Collected" shows ₹NaN**
Root cause: the invoice list API never serializes `paidCents` (it's computed transiently in the service), so `revenue += inv.paidCents` summed `undefined` → NaN. Fix: dashboard and reports now derive paid totals from the included CAPTURED `payments` rows (with finite-number coercion). Verified: dashboard shows ₹21,830.
*Fixed in:* `app/admin/(dashboard)/dashboard/page.tsx`, `app/admin/(dashboard)/reports/page.tsx`. (Follow-up: serialize `paidCents` server-side so every consumer gets it.)

**ISS-03 ✅ FIXED — RMO form: sleep-related dropdowns had wrong/duplicate option values**
Sleep Position, Pillows, and Mattress selects now store distinct, label-matching values (`supine/prone/left lateral/right lateral`, `no pillows/<3in/>3in`, `floor or wood hard/soft/semi-hard/hard/orthopedic`). Note: rows saved before the fix hold the old ambiguous values (`none/light/deep/apneic spells`) and won't rehydrate into the new options.
*Fixed in:* `app/admin/(dashboard)/appointments/[id]/consultation/page.tsx`.

**ISS-04 ☑️ NOT A BUG — Public header "Request Consultation" element click**
Re-investigated: nothing overlays the link and navigation does fire — Next.js Link prevents default and routes client-side, which in dev (route compiled on demand) lands a beat later than the automated check polled. Human clicks work. Keep generous waits in E2E scripts; no code change.

**ISS-05 ✅ FIXED — Quiz count mismatch & ghost question**
Landing copy now reads "Up to sixteen physician-designed questions" (men answer 15). Both admin answer views (Assessments detail + appointment Quiz page) now render only the questions the respondent was actually asked — the female-only question is filtered out of male submissions and numbering follows the respondent's quiz (verified: 15 rows, Q1–Q15, no "— not answered —").
*Fixed in:* `app/(public)/assessment/page.tsx`, `app/admin/(dashboard)/assessments/[id]/page.tsx`, `app/admin/(dashboard)/appointments/[id]/quiz/page.tsx`.

## Flow / UX gaps

**ISS-06 ✅ FIXED (partial) — Auto-completion now requires a real prescription**
"Prescription ready" is now strict: a non-empty **Diagnosis** plus at least one treatment line (supplement row, infusion row, or medications text). A stray advice note can no longer complete the appointment. Draft saves still allowed with empty fields by design (clinicians save work-in-progress); full required-field validation on the RMO form remains open as a polish task.
*Fixed in:* `DoctorConsultation.tsx` (`prescriptionReady`).

**ISS-07 ✅ FIXED — Completion dead-end from REQUESTED**
If the COMPLETED transition fails (appointment never accepted), the save flow now steps the appointment through CONFIRMED → COMPLETED automatically — the doctor running the consult implies acceptance.
*Fixed in:* `DoctorConsultation.tsx` (transition chain).

**ISS-08 ✅ FIXED — Single-record access now account-scoped**
New `assertAppointmentAccess()` ownership gate in the appointment service: ADMIN/RECEPTION pass; any other role must be the assigned staff member. Applied to appointment detail (`getAppointment`), status transitions, and the per-appointment consultation (GET+POST), RMO-summary, and quiz endpoints. Verified: doctor fetching another staff member's appointment/quiz/rmo-summary gets **403**; own records still 200.
*Fixed in:* `lib/services/appointment.ts`, `app/api/appointments/[id]/{consultation,rmo-summary,quiz}/route.ts`.
*Note:* a transient **500 INTERNAL_ERROR** seen mid-development on the forbidden path was a stale dev-server (HMR) compile artifact — on retest the gate returns the correct **403 FORBIDDEN**. The existing `isServiceAppError()` branch in `errorResponse()` already maps `lib/errors.ts` AppErrors to their real status; no mapper change was needed.

**ISS-09 ✅ FIXED — Reception exempted from own-only scoping**
List scoping now keys off `FULL_BOOK_ROLES` (ADMIN + RECEPTION) — front desk manages the whole book again; doctors/RMOs/specialists stay scoped to their own appointments.
*Fixed in:* `lib/services/appointment.ts`.

**ISS-10 ✅ FIXED — Prescription view no longer creates data**
The prescription page now uses the read-only GET (returns the linked consultation or null) instead of the find-or-create POST; the friendly "no doctor consultation to print" state covers the null case.
*Fixed in:* `app/admin/(dashboard)/appointments/[id]/prescription/page.tsx`.

**ISS-11 ✅ FIXED — Actions column reachable under horizontal scroll**
The Actions header and cell are now `sticky right-0` with matching backgrounds, so the kebab stays pinned and clickable while the table scrolls sideways.
*Fixed in:* `components/admin/AppointmentsList.tsx`.

## Polish / decisions

**ISS-12 ✅ FIXED — Prescription stable identity + clinic constants**
"Report generated" now reads the consultation's last-save time (`updatedAt`) instead of render-time `new Date()`, so two prints of the same record are byte-identical (verified: reload keeps `13 Jun 2026 | 12:15 AM`). Prescription ID derives its year from persisted data, not the wall clock. Clinic letterhead values (KMC Reg, phone, website, email, address) are consolidated into a single `CLINIC` constant for one-place editing, and the misleading static "Scan to access your report online" QR caption was removed. Remaining: real registration/contact values + an actual QR are a data/asset task, not code.
*Fixed in:* `app/admin/(dashboard)/appointments/[id]/prescription/page.tsx`.

**ISS-13 ✅ FIXED — Mode options aligned to the sheet**
The consultation Mode select now offers **In-Clinic / Online** only (dropped the redundant "In-Person"), matching the printed sheet's two-state checkbox. Legacy rows saved as "In-Person" still tick the In-Clinic box.
*Fixed in:* `lib/main-fields.ts`.

**ISS-14 ✅ FIXED — Consultation footer no longer overlaps the sidebar**
The action footer changed from viewport-`fixed` with sidebar-width margin hacks to `sticky bottom-0` inside the scrolling content column (negative margins cancel `<main>`'s padding so it still spans full width). Verified: footer aligns to the content column; "Help & Support" stays visible.
*Fixed in:* `DoctorConsultation.tsx`.

**ISS-15 🟡 OPEN (accepted) — Prescription preview sideways scroll**
The sheet keeps its fixed 1040px design width; in narrower admin content areas the on-screen preview scrolls horizontally. **Print is unaffected** (zoom-fit to A4). Left as-is to avoid a brittle responsive-scale hack; a scale-to-fit preview or a full-width print route outside the dashboard shell is the future option.

**ISS-16 ✅ FIXED — Doctor form pre-fills from the RMO intake**
The doctor's Patient Detail now seeds still-empty fields (DOB, gender, occupation, consultation date, chief concerns, family history) from the attached RMO summary, so shared data isn't re-keyed. Saved doctor values always win — only blanks are filled. Referral and vitals are intentionally excluded because their RMO option values differ (the source of the "walk-in" vs "Self" mismatch).
*Fixed in:* `DoctorConsultation.tsx` (`RMO_PREFILL`).
