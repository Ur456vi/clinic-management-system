# Configuration & secrets

All runtime configuration in Vyara flows through environment variables. The complete list of supported vars lives in [`.env.example`](../.env.example).

## Where each environment gets its values

| Environment | Source |
|---|---|
| Local dev | `.env.local` (gitignored), copied from `.env.example` |
| CI tests | repo secrets injected at job time |
| Staging / production | the deployment platform's secret store (Vercel / Railway / Fly / AWS Secrets Manager) |

**Never commit a populated `.env*` file to the repo.** Only `.env.example` (no real values) is checked in.

## Validation

`lib/env.ts` reads `process.env` once at module load, validates it, and exports a typed `env` object.

```ts
import { env } from "@/lib/env"

// Typed, validated:
const url = env.DATABASE_URL  // string
const ttl = env.OTP_TTL_SECONDS  // number
const portalOn = env.FEATURE_PATIENT_PORTAL  // boolean
```

Behaviour:

- **In `production`**, missing required vars throw `EnvError` at startup. The app fails to boot — by design.
- **In `development` / `test`**, missing required vars emit a console warning but don't crash. This lets devs work on the frontend without (e.g.) Razorpay keys set.

## Categories

The `.env.example` is grouped:

| Group | Required in dev | Required in prod | Notes |
|---|---|---|---|
| Application (`NEXT_PUBLIC_APP_URL`, `APP_URL`) | yes | yes | Use `http://localhost:3000` locally. |
| Database (`DATABASE_URL`) | yes | yes | Production must use `?sslmode=require`. |
| Auth (`NEXTAUTH_SECRET`, OTP settings) | yes | yes | Generate secret with `openssl rand -base64 32`. |
| Email (`RESEND_API_KEY`) | no | yes | Required for OTP delivery in prod. |
| WhatsApp | no | optional | Feature can be off if not configured. |
| Storage (S3) | no | yes | Lab PDF uploads break without it. |
| Payments (Razorpay) | no | yes | Required for online payment links. |
| Encryption (`DATA_ENCRYPTION_KEY`) | no | yes | PHI column encryption (BE-53). |
| Observability (Sentry, log level) | no | recommended |  |
| Feature flags | no | no | Optional. |

## Generating secrets

```bash
# 32-byte base64 secret (for NEXTAUTH_SECRET, DATA_ENCRYPTION_KEY)
openssl rand -base64 32

# 16-byte hex (if you prefer)
openssl rand -hex 16
```

## Rotating a secret

1. Generate the new value.
2. Add it to the secret store under a temporary suffix (e.g. `NEXTAUTH_SECRET_V2`).
3. Deploy code that reads both old and new (transition period).
4. Cut over to the new value.
5. Remove the old value after the rotation window (long enough for all sessions to expire).

`DATA_ENCRYPTION_KEY` rotation is a separate, more involved process — see BE-53 when implemented.

## Common dev-setup mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `DATABASE_URL is required` warning | Missing `.env.local` | `cp .env.example .env.local` |
| Prisma can't reach DB | Postgres not running | `npm run db:up` |
| `[env] OTP_TTL_SECONDS must be a number, got abc` | Bad value type | Fix the type in `.env.local` |
| Login works locally but not in prod | `NEXTAUTH_URL` not set in prod env | Set it to the public origin |
