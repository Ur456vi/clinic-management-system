# Legal advisory — BE-05 email-OTP password reset

**Filed by:** PM Agent
**Filed on:** 2026-05-14
**Branch:** `task/BE-05-password-reset-otp` @ 34b24a0
**Owner for review:** Adv. Aman Kaushik (Legal Head)
**Concern level:** Medium (auth flow + new PII channel)

## What this change touches

BE-05 adds the three-endpoint email-OTP password reset flow (`POST /api/auth/password-reset/{request,verify,confirm}`), a new `PasswordResetOtp` Prisma model (bcrypt-hashed OTP, 15-min TTL, 5-attempts cap), and a minimal `lib/email.ts` helper that hits **Resend** (https://resend.com) over HTTP when `RESEND_API_KEY` is set, otherwise falls back to console logging in dev.

The schema change also adds a 1:1 `User.patient`/`Patient.user` back-relation (nullable, unique) so a future patient-portal login can join to a Patient row — this links a login-identity surface to PHI for the first time on `main`.

## Why it matters for legal review

- **New transactional-email vendor in the data path.** `lib/email.ts` sends a user's email address (PII) plus a 6-digit OTP to Resend. We do not yet have a DPA / sub-processor agreement on file with Resend. DPDP Act §§ 8(5)–(7) require a written contract before passing personal data to a processor.
- **Enumeration-resistance is implemented** — `/request` always returns 200; verify/confirm return a single generic 422 — which is the right posture but worth Aman noting if any downstream audit trail discloses which emails were attempted.
- **Password hash + reset secret use `NEXTAUTH_SECRET` as fallback** when `RESET_TICKET_SECRET` is not set. Acceptable for Sprint-1 dev, but the production runbook should require a distinct secret before any clinic data is loaded.

## Recommendation for Aman

Low/medium concern. Two follow-ups for Aman to weigh in on:
1. Status of a Resend DPA — needs to be on file before clinic email addresses flow through Resend in production.
2. Confirm DPDP notice/consent at user registration covers "your email may be used for security notifications (e.g. password reset)".

The merge proceeds under Sprint-1 advisory mode.
