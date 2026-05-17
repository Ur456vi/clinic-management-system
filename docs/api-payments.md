# Razorpay (mock) Payment API

Razorpay-shaped payment endpoints for the May-28 demo (BE-41). **Sprint 1
ships a mock** — there is no outbound call to Razorpay, signatures are
verified against `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` which
default to literal mock values when unset. The wire shape matches the
real Razorpay SDK so the FE-10 checkout widget will not change when we
swap in the live SDK in Sprint 2.

All routes live under `/api/payments/razorpay` and follow the BE-07
conventions: `{ data }` / `{ error }` envelopes, `x-request-id` response
header, audit-log writes for every write of PHI / billing rows. The
`order` + `verify` endpoints require an authenticated session; the
`webhook` endpoint does **not** (it is signed by Razorpay).

The Payment + Invoice models are owned by BE-37 — see
[`api-reference.md`](./api-reference.md) for the desk-clerk cash-receipt
counterpart at `POST /api/invoices/:id/payments`.

---

## Flow

```
   Browser                                        Vyara API                Razorpay (mock)
      │                                                │                          │
      │  POST /api/payments/razorpay/order             │                          │
      │ ────────────────────────────────────────────►  │                          │
      │  { invoiceId }                                 │                          │
      │                                                │  (no outbound call —     │
      │                                                │   pure function)         │
      │  200 { razorpayOrderId, razorpayKeyId,         │                          │
      │        amountCents, currency }                 │                          │
      │ ◄────────────────────────────────────────────  │                          │
      │                                                │                          │
      │   Open Razorpay checkout widget                │                          │
      │  (FE-10 mock signs server-side and             │                          │
      │   returns razorpay_payment_id + signature)     │                          │
      │                                                │                          │
      │  POST /api/payments/razorpay/verify            │                          │
      │ ────────────────────────────────────────────►  │                          │
      │  { invoiceId, razorpayOrderId,                 │                          │
      │    razorpayPaymentId, razorpaySignature }      │                          │
      │                                                │                          │
      │                                                │  HMAC verify             │
      │                                                │  recordPayment(...)      │
      │                                                │                          │
      │  200 { invoice, paymentId, alreadyRecorded }   │                          │
      │ ◄────────────────────────────────────────────  │                          │
      │                                                │                          │
      │                                                │  ◄── POST /webhook       │
      │                                                │     x-razorpay-signature │
      │                                                │     payment.captured     │
```

The webhook is independent of the verify call — Razorpay sends it
asynchronously and we treat it as the source-of-truth refresh. The
verify endpoint is idempotent on `gatewayRef` so racing the webhook
won't double-book a payment.

---

## `POST /api/payments/razorpay/order`

Create a (mock) Razorpay order for an invoice's remaining balance.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `invoiceId` | uuid | yes | Must reference an existing Invoice that is not `PAID` or `VOID`. |

### Response (200)

```json
{
  "data": {
    "invoiceId": "f5b5...",
    "invoiceNumber": "INV-2026-000123",
    "remainingCents": 250000,
    "razorpayOrderId": "order_mock_3c9af1a2",
    "razorpayKeyId": "rzp_test_mock_key",
    "amountCents": 250000,
    "currency": "INR"
  }
}
```

`remainingCents = totalCents - sum(CAPTURED payments)`. The order is
created against the remaining balance, not the original total — partial
payments compose cleanly.

### Errors

- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `404 NOT_FOUND` — invoice does not exist.
- `409 CONFLICT` with `details.code = INVOICE_ALREADY_PAID` / `INVOICE_VOID` / `INVOICE_FULLY_PAID`.

### Example

```bash
curl -X POST http://localhost:3000/api/payments/razorpay/order \
  -H "Content-Type: application/json" \
  -H "Cookie: <session cookie>" \
  -d '{"invoiceId":"f5b5b7a0-...-..."}'
```

---

## `POST /api/payments/razorpay/verify`

Verify the Razorpay checkout-success handshake and book the payment.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `invoiceId` | uuid | yes | Must match the invoice the order was created for. |
| `razorpayOrderId` | string (<=120) | yes | From the order response above. |
| `razorpayPaymentId` | string (<=120) | yes | Returned by the Razorpay widget on success. |
| `razorpaySignature` | string (<=256) | yes | HMAC-SHA256 of `${orderId}|${paymentId}` with `RAZORPAY_KEY_SECRET`. |

### Response (200)

```json
{
  "data": {
    "invoice": { "id": "...", "status": "PAID", "payments": [ ... ] },
    "paymentId": "9c1a...",
    "alreadyRecorded": false
  }
}
```

`alreadyRecorded` is `true` when the gateway payment id was already
booked (the webhook beat the redirect, or the FE retried). The invoice
is returned as-is — no second Payment row is created.

### Errors

- `400 VALIDATION_ERROR` with `details.code = INVALID_SIGNATURE` — HMAC mismatch.
- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `404 NOT_FOUND` — invoice does not exist.
- `409 CONFLICT` — invoice is VOID or has no remaining balance.

### Example

```bash
curl -X POST http://localhost:3000/api/payments/razorpay/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: <session cookie>" \
  -d '{
    "invoiceId":         "f5b5b7a0-...-...",
    "razorpayOrderId":   "order_mock_3c9af1a2",
    "razorpayPaymentId": "pay_mock_a1b2c3d4e5",
    "razorpaySignature": "<hex-hmac-sha256>"
  }'
```

---

## `POST /api/payments/razorpay/webhook`

Razorpay-style webhook ingest. Razorpay's server posts here directly —
**no session auth**; the request is authenticated by the
`x-razorpay-signature` header (HMAC-SHA256 of the raw body with
`RAZORPAY_WEBHOOK_SECRET`).

Idempotent on `gatewayRef`: a repeat delivery updates the existing
Payment row's status rather than inserting a duplicate. The invoice
status is re-derived from the sum of CAPTURED payments after each call.

| Aspect | Value |
| --- | --- |
| Auth | none (signed body) |
| Method | `POST` |
| Content-Type | `application/json` |
| Headers | `x-razorpay-signature: <hex>` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `event` | string | yes | E.g. `payment.captured`, `payment.failed`, `payment.refunded`. |
| `payload.payment.entity.id` | string | yes | Razorpay payment id — booked as `Payment.gatewayRef`. |
| `payload.payment.entity.order_id` | string | yes | Razorpay order id (informational). |
| `payload.payment.entity.status` | string | yes | One of: `captured`, `authorized`, `created`, `failed`, `refunded`. Mapped to `PaymentStatus`; unknown values default to `PENDING`. |
| `payload.payment.entity.amount` | integer | yes | Amount in cents/paise. |
| `payload.payment.entity.currency` | string | yes | Expected `INR`. |
| `payload.payment.entity.notes.invoiceId` | uuid | no | Preferred way to link a payment to a Vyara invoice. Falls back to looking up the existing Payment row by `gatewayRef`. |

### Response (200)

```json
{
  "data": {
    "acknowledged": true,
    "matched": true,
    "invoiceId":    "f5b5...",
    "paymentId":    "9c1a...",
    "invoiceStatus": "PAID"
  }
}
```

When the webhook cannot resolve an invoice (no `notes.invoiceId`, no
prior Payment row keyed on `gatewayRef`), the response is
`{ acknowledged: true, matched: false }` with `200`. We still return 2xx
so Razorpay does not retry indefinitely — the event is logged for an
operator to investigate.

### Errors

- `401 UNAUTHORIZED` with `details.code = INVALID_SIGNATURE` — `x-razorpay-signature` did not match.
- `400 VALIDATION_ERROR` — body did not parse as JSON, or shape did not match `webhookPayloadSchema`.

### Example

```bash
BODY='{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_mock_a1b2c3d4e5","order_id":"order_mock_3c9af1a2","status":"captured","amount":250000,"currency":"INR","notes":{"invoiceId":"f5b5b7a0-...-..."}}}}}'
SIG=$(printf %s "$BODY" | openssl dgst -sha256 -hmac "mock-webhook-secret" | awk '{print $2}')

curl -X POST http://localhost:3000/api/payments/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: $SIG" \
  --data-raw "$BODY"
```

---

## Environment

| Var | Sprint 1 default (mock) | Notes |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_test_mock_key` | Returned to the FE so the checkout widget can render. |
| `RAZORPAY_KEY_SECRET` | `mock-secret` | Used by `verifyMockSignature` for the checkout-success handshake. |
| `RAZORPAY_WEBHOOK_SECRET` | `mock-webhook-secret` | Used by `verifyWebhookSignature` for the inbound webhook. |

Real keys land in Sprint 2 when the live `razorpay` Node SDK replaces
the mock in `lib/services/razorpay.ts`.
