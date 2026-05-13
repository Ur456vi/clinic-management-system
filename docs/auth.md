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
