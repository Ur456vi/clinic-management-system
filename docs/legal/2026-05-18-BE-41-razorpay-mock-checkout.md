# Advisory legal memo — BE-41 Razorpay mock checkout

**Date:** 2026-05-18 (Sprint 1 Day 6)
**Branch:** `task/BE-41-razorpay-mock-checkout` → merged into `main` this shift
**Reviewer:** PM-Agent (advisory only, non-blocking)
**Cc:** Adv. Aman Kaushik <amankaushik39@gmail.com> (no action required unless ≥3 memos accumulate this week)

## Scope of change

Introduces a Razorpay-mock checkout integration:

- `app/api/payments/razorpay/order/route.ts` — order creation endpoint
- `app/api/payments/razorpay/verify/route.ts` — signature verification endpoint
- `app/api/payments/razorpay/webhook/route.ts` — webhook receiver for payment status events
- `lib/services/razorpay.ts` — service layer wrapping Razorpay SDK calls (key ID, key secret, webhook signing key)
- `lib/validation/payment.ts` — Zod schemas for order/verify/webhook payloads
- `docs/api-payments.md` — public API reference
- `.env.example` — adds `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

## Surfaces touched (advisory triggers)

- **Billing / Invoice / Payment surface** — directly under `app/api/payments/**`. Triggers the advisory legal-review rule per the PM Agent SOP.

## Sprint-1 posture

- **Mock mode only.** Per `docs/sprint-1-mvp.md` (Day 11 target, pulled forward), the Razorpay integration uses **test-mode keys** and returns a mocked success state for the May 28 demo. No live payment instruments are charged. Real money flows are explicitly deferred to Sprint 2.
- **No PII/PHI added to the schema.** Payment metadata persists alongside existing `Invoice`/`Payment` rows already on main; no new patient-identifying fields introduced by this branch.
- **Secrets handling.** Razorpay keys land in `.env` (and for prod, AWS Secrets Manager INF-07 in Sprint 2). They are not committed; `.env.example` ships placeholders only. The webhook secret is used for HMAC verification of inbound events.
- **Webhook surface is anonymous-by-design.** The `/api/payments/razorpay/webhook` route trusts HMAC signature, not session. Signature mismatch returns 401.

## Risk classification

**LOW (Sprint 1)** — mock mode, test keys, no live charges, no new PHI. Acceptable for the Milestone 1 demo on a clinic-internal EC2 IP.

**MEDIUM (Sprint 2 cutover)** — once real keys land and live charges begin, the following need review before production:

1. **Refund + chargeback handling** — not in BE-41 scope; file as Sprint 2 follow-up.
2. **PCI-DSS SAQ-A applicability** — Razorpay-hosted checkout keeps us in SAQ-A scope. Confirm during Sprint 2 production cutover.
3. **GST invoice fields** — `Invoice` model should include GSTIN, HSN/SAC, place-of-supply before live billing.
4. **DPDP Act §6 notice** — payment confirmation copy / receipt screen must reference the data-processing notice. FE-10 (Dhanjay, Day 11) owns this UI; flag for compliance copy review then.
5. **Webhook IP allowlist** — Razorpay publishes a webhook source IP range; nginx (INF-08) should allowlist before production.

## Recommendation

**Non-blocking — merge approved for Sprint 1 demo.** Re-review at the Sprint 2 production-cutover gate before flipping `RAZORPAY_MODE` from `test` to `live`.

Aman notified only via this memo; no direct ping issued (rule: direct ping only when ≥3 memos accumulate in a single week — current week: 1 of 3).

— PM-Agent
