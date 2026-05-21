# Advisory legal memo — BE-52 CORS + CSRF + security headers

**Date:** 2026-05-21 (Sprint 1 Day 9)
**Branch:** `task/BE-52-cors-security-headers` → merged into `main` this shift
**Reviewer:** PM-Agent (advisory only, non-blocking)
**Cc:** Adv. Aman Kaushik <amankaushik39@gmail.com> (no action required unless ≥3 memos accumulate this week)

## Scope of change

Hardens the API perimeter that fronts every authn'd PHI / billing surface:

- `lib/api/cors.ts` — origin allow-list (`env.CORS_ALLOWED_ORIGINS`), `preflight()` for OPTIONS, `applyCors()` echoes only allow-listed origins with `Vary: Origin`.
- `lib/api/handler.ts` — `defineHandler` now handles preflight + a same-origin CSRF check for mutating verbs (POST/PUT/PATCH/DELETE). `/api/webhooks/*` is exempted (signature-authenticated).
- `lib/env.ts` / `.env.example` — `CORS_ALLOWED_ORIGINS` parsed as comma-separated list.
- `next.config.ts` — global security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, etc.).

## Surfaces touched (advisory triggers)

- **Auth + every PHI/billing route** indirectly — `defineHandler` wraps the full `/api/**` surface (auth, patients, consultations, lab-results, invoices, payments, consent). The CSRF guard now stands between the patient/staff browser session and any mutating call to those resources.

## Sprint-1 posture

- **Default-deny CORS.** Unset env → only `http://localhost:3000` permitted. Production allow-list must be explicit before the Day 9 EC2 deploy.
- **CSRF: same-origin enforcement** on mutating verbs via Origin/Referer check. Backed by NextAuth cookie-session; no token-based CSRF needed for cookie-auth surface.
- **No exemption for PHI/billing endpoints** — every patient/consultation/lab-result/invoice/payment route inherits the guard automatically by virtue of going through `defineHandler`. Webhook carve-out applies to `/api/webhooks/*` only.
- **Security headers** baseline-only: no HSTS yet (TLS is Sprint 2 / INF-08 follow-up — currently nginx HTTP only), no CSP.

## Risk classification

**LOW (Sprint 1)** — this is hardening, not new data exposure. Net-positive for DPDP §8 ("reasonable security safeguards") and DISHA-leaning posture.

**MEDIUM (Sprint 2 cutover) — followups to confirm with Aman:**
1. **HSTS + TLS** — required once Sprint 2 ships TLS at nginx. Add `Strict-Transport-Security` then.
2. **CSP** — currently absent. Add a real Content-Security-Policy before opening the portal beyond Dr. Yuvraaj's pilot users.
3. **Webhook exemption audit** — confirm `/api/webhooks/*` exemption is acceptable; verify each webhook endpoint validates signatures (Razorpay et al.) before going live.
4. **Production origin allow-list** — must be explicitly set in EC2 env before Day 9 deploy. Empty env defaults to localhost-only, which will silently break the deployed UI.

## Action

None blocking. Memo on file. Running count this week: 1 (BE-52). Below the 3-memo Aman-ping threshold.
