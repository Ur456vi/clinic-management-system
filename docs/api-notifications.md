# Notifications API

In-app notification feed for staff and patient logins (BE-45). Domain
events (RMO -> Doctor handoff, plan signed, invoice paid, ...) fan out
from the service layer by inserting one `Notification` row per
recipient via `emitNotification` in `lib/services/notifications.ts`.
The HTTP surface is read-only: clients list their own feed and flip
rows to read.

All routes live under `/api/notifications` and follow the BE-07
conventions: `{ data }` / `{ error }` envelopes, `x-request-id`
response header, session required.

Every endpoint requires an authenticated session (NextAuth JWT).
Unauthenticated calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## Notification shape

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key. |
| `userId` | uuid | Recipient — User table (staff and patient logins both live there). |
| `kind` | `NotificationKind` | See enum below. |
| `title` | string | Short headline rendered in the feed row. |
| `body` | string \| null | Optional secondary line. |
| `sourceType` | string \| null | Polymorphic source entity, e.g. `"Consultation"`, `"TreatmentPlan"`, `"Invoice"`. No FK. |
| `sourceRefId` | uuid \| null | Id of the source entity. |
| `readAt` | iso8601 \| null | `null` while the notification is unread. |
| `createdAt` | iso8601 | Server timestamp at emit. |

### `NotificationKind`

| Value | Emitted by |
| --- | --- |
| `HANDOFF` | `consultation.transition` on `DRAFT -> RMO_DONE`. |
| `APPOINTMENT_REMINDER` | Reserved for the BE-35 reminder scheduler (later sprint). |
| `INVOICE_ISSUED` | Reserved — wires up when the invoice issuance flow lands. |
| `PAYMENT_RECEIVED` | `invoice.recordPayment` when an invoice transitions to `PAID`. |
| `PLAN_SIGNED` | `treatment-plan.signPlan` when a DRAFT plan flips to SIGNED. |
| `GENERIC` | Catch-all for ad-hoc messages. |

---

## `GET /api/notifications`

List the calling user's notifications, newest first.

| Aspect | Value |
| --- | --- |
| Auth | required (any role) |
| Method | `GET` |
| Body | none |

### Query parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `unread` | bool-ish | no | `true` / `1` / `yes` filters to `readAt IS NULL`. Anything else is treated as `false` (all rows). |
| `cursor` | string | no | Keyset cursor — the `id` of the last row from the previous page. Omit for page 1. |
| `limit` | integer | no | Page size, default **20**, max **100**. Out-of-range values clamp. |

#### Example request

```
GET /api/notifications?unread=true&limit=20
```

### Response (200)

```json
{
  "data": [
    {
      "id": "9c1a...",
      "userId": "f5b5...",
      "kind": "PLAN_SIGNED",
      "title": "Your treatment plan has been signed",
      "body": "Hashimoto's protocol — May 2026",
      "sourceType": "TreatmentPlan",
      "sourceRefId": "8b3f...",
      "readAt": null,
      "createdAt": "2026-05-17T11:38:00.000Z"
    }
  ],
  "nextCursor": null,
  "pagination": { "next": null }
}
```

`nextCursor` is the `id` to pass back as `?cursor=<id>` for the next
page. It is `null` when this is the last page.

### Errors

- `401 UNAUTHORIZED`.

---

## `POST /api/notifications/:id/read`

Flip a single notification's `readAt` to the server clock. The row must
be owned by the calling user — calling with someone else's notification
id returns 403.

| Aspect | Value |
| --- | --- |
| Auth | required (any role) |
| Method | `POST` |
| Body | none |

### Response (200)

```json
{ "data": { "id": "9c1a...", "readAt": "2026-05-17T11:39:42.000Z", ... } }
```

Already-read notifications return as-is (no re-stamp).

### Errors

- `400 VALIDATION_ERROR` — `id` is not a uuid.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — notification belongs to a different user.
- `404 NOT_FOUND` — no notification with that id.

---

## `POST /api/notifications/read-all`

Mark every unread notification for the calling user as read.

| Aspect | Value |
| --- | --- |
| Auth | required (any role) |
| Method | `POST` |
| Body | none |

### Response (200)

```json
{ "data": { "updated": 7 } }
```

`updated` is the count of rows flipped from unread to read in this
call. Already-read rows are not touched.

### Errors

- `401 UNAUTHORIZED`.

---

## Idempotency

`emitNotification` (the service-layer fan-out entry point used by
domain events) deduplicates on the
`(userId, kind, sourceType, sourceRefId)` tuple **when all four are
provided**. If a matching row already exists the existing row is
returned and no new row is inserted. This makes the function safe to
call from retry-prone code paths (webhook handlers, idempotent
transitions). Emitters that legitimately omit the source pair (e.g.
`GENERIC` system-wide messages) remain additive — each call writes a
new row.
