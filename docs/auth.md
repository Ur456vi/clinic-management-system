# Authentication

Vyara uses [NextAuth.js v4](https://next-auth.js.org/) with a single
**email + password** credentials provider, backed by our own Postgres
`User` table. Sessions are signed JWTs, not DB rows.

This document covers:

1. How a login flows end-to-end
2. How to read the session from server code (`getSession`, `requireUser`)
3. How to test locally

---

## Login flow

1. The client POSTs `{ email, password }` to
   `POST /api/auth/callback/credentials` (NextAuth's built-in endpoint).
2. The `authorize` function in `lib/auth.ts`:
   - Lowercases / trims the email.
   - Loads the `User` row by email (`db.user.findUnique`).
   - Rejects if the user is missing or `isActive === false`.
   - Calls `verifyPassword(plain, user.passwordHash)` (bcryptjs, cost 12).
   - On success, writes two rows in a single transaction:
     - `User.lastLoginAt = now()`
     - `AuditLog { action: "LOGIN", entityType: "User", entityId: user.id }`
   - Returns `{ id, email, role }`.
3. NextAuth issues a signed JWT containing `userId`, `email`, and `role`,
   stored in an HTTP-only cookie (`__Secure-next-auth.session-token` in
   production, `next-auth.session-token` in dev).
4. Subsequent requests carry the cookie; our `jwt` and `session` callbacks
   project the custom claims back onto `session.user`.

The token TTL is **12 hours** — long enough for a clinic shift, short
enough that a stolen laptop loses access by the next morning.

---

## Reading the session from server code

Both helpers live in `lib/auth.ts` and are safe to call from:

- Server components
- Route handlers (`app/**/route.ts`)
- Server actions

### Optional auth — `getSession()`

```ts
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ greeting: "hello, stranger" })
  }
  return Response.json({ greeting: `hello, ${session.user.email}` })
}
```

### Required auth — `requireUser()`

```ts
import { requireUser } from "@/lib/auth"

export async function GET() {
  const user = await requireUser()
  // user is { userId, email, role } — fully typed
  return Response.json({ userId: user.userId, role: user.role })
}
```

`requireUser()` throws `UnauthorizedError` (status 401) when no session
exists. Let it bubble — the top-level API error handler maps the
`statusCode` field to an HTTP response.

### Role gating

For role-based authorization, layer on top of `requireUser`:

```ts
import { requireUser } from "@/lib/auth"
import { ForbiddenError } from "@/lib/errors"

const user = await requireUser()
if (user.role !== "ADMIN") {
  throw new ForbiddenError("Admins only")
}
```

A dedicated `requireRole` helper will land in a later task.

---

## Testing locally

1. Make sure `NEXTAUTH_SECRET` is set in `.env.local`. Any random 32-byte
   value works in dev — `openssl rand -base64 32`.

2. Create a user with a known password using `prisma:seed` or a quick
   script:

   ```ts
   import { db } from "@/lib/db"
   import { hashPassword } from "@/lib/passwords"

   await db.user.create({
     data: {
       email: "admin@vyara.local",
       passwordHash: await hashPassword("changeme123"),
       role: "ADMIN",
     },
   })
   ```

3. Start the dev server (`npm run dev`) and sign in via the
   `signIn("credentials", { email, password })` helper from
   `next-auth/react`, or hit the endpoint directly:

   ```bash
   curl -i -X POST http://localhost:3000/api/auth/callback/credentials \
     -d 'email=admin@vyara.local&password=changeme123&csrfToken=...'
   ```

   (For interactive testing, the built-in `/api/auth/signin` page is the
   easiest path.)

4. Inspect the session at `GET /api/auth/session` — it should return:

   ```json
   {
     "user": {
       "userId": "…uuid…",
       "email": "admin@vyara.local",
       "role": "ADMIN"
     },
     "expires": "…"
   }
   ```

5. Verify the `AuditLog` table picked up the `LOGIN` row:

   ```sql
   SELECT action, entity_type, entity_id, occurred_at
     FROM audit_logs
    WHERE action = 'LOGIN'
    ORDER BY occurred_at DESC
    LIMIT 5;
   ```

---

## What's deliberately out of scope here

- Patient portal login — separate model and provider, lands in BE-47.
- OAuth providers (Google, Microsoft) — straightforward to add later,
  the `Account` model is intentionally absent until needed.
- Rate limiting on `authorize` — handled at the edge / middleware
  layer in a later task.
- Password reset flow — uses the `VerificationToken` model we declared
  here. Lands with the user-management task.

---

## Password reset (BE-05)

Self-service password reset via a one-time code sent to the registered
email. Three endpoints, one OTP row per attempt, all rate-limited at the
DB layer for Sprint 1.

### Endpoints

| Method | Path                                  | Body                              | Success                       |
|---|---|---|---|
| POST | `/api/auth/password-reset/request`    | `{ email }`                       | `200 { data: { ok: true } }` (always) |
| POST | `/api/auth/password-reset/verify`     | `{ email, otp }`                  | `200 { data: { ticket } }`    |
| POST | `/api/auth/password-reset/confirm`    | `{ ticket, newPassword }`         | `200 { data: { ok: true } }`  |

### Flow

1. **Request.** Client posts the email. The route always returns 200 — we
   do not leak whether an account exists. If the email maps to an active
   user AND fewer than 5 OTPs have been issued to that user in the last
   hour, we:
   - generate a cryptographically-random 6-digit OTP (Web Crypto, never
     `Math.random`),
   - bcrypt-hash it (cost 10 — single-use + short-lived, so we trade a bit
     of hash strength for latency),
   - insert a `PasswordResetOtp` row with `expiresAt = now + 15 min`,
   - send the code via `lib/email.ts` (Resend in prod, console logger in
     dev / test when `RESEND_API_KEY` is unset). Provider failures are
     logged but never surfaced to the client.

2. **Verify.** Client posts `{ email, otp }`. We load the most recent
   un-burned OTP for that user; reject if missing, expired, or the row's
   `attempts >= 5`. On mismatch we bump `attempts` and return a generic
   422. On match we burn the row (`usedAt = now()`) and mint a short-lived
   reset ticket — a JWT with claims `{ sub: userId, jti: otpId, scope:
   "password-reset" }`, signed with `RESET_TICKET_SECRET` (falls back to
   `NEXTAUTH_SECRET` when not set), `exp = now + 5 min`.

3. **Confirm.** Client posts `{ ticket, newPassword }`. We verify the
   ticket signature + expiry, confirm the referenced OTP row exists for
   the same user and was burned, hash the new password with `bcryptjs`
   cost 12 (via `lib/passwords.ts`), and write it to `User.passwordHash`
   in a single transaction that also invalidates any other outstanding
   OTPs for the user and writes an `AuditLog { action: "UPDATE", detail:
   { event: "password-reset.confirmed" } }` row.

### Rate-limit policy

- **5 OTP requests per user per rolling hour.** Counted via
  `PasswordResetOtp.createdAt`. Excess requests are silently dropped —
  the caller still sees 200, preserving enumeration resistance.
- **5 verify attempts per OTP.** Once exhausted the row is dead even if
  the correct code arrives later.

This is a holding pattern; a Sprint-2 hardening task will move both
limits to Redis with a token bucket, and add a per-IP limit at the edge.

### Email delivery

`lib/email.ts` exposes a single `sendMail({ to, subject, text })` helper.
It uses the Resend HTTP API directly (no SDK, so the helper is edge-safe)
when `RESEND_API_KEY` is set, otherwise it logs the payload to stdout so
local + test environments can still exercise the flow end-to-end.

### Why not reuse `VerificationToken`?

The NextAuth `VerificationToken` model is purpose-built for the magic-link
provider (no attempt counter, no hash field, primary key is the token
itself). The OTP flow needs `attempts`, `usedAt`, and a hashed credential
— a dedicated `PasswordResetOtp` model keeps both flows clean and lets us
adopt magic links later without a schema collision.

### Open follow-ups

- Move rate-limiting to Redis (Sprint 2).
- Add per-IP rate-limit at the middleware layer (Sprint 2).
- Add a structured email template (React Email or MJML) when we have a
  third transactional template to maintain.
