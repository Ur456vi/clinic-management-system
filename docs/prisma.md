# Prisma — ORM and migrations

Vyara uses **Prisma** (v6) as the ORM. Schema lives in `prisma/schema.prisma`. The Prisma client is exported as a singleton from `lib/db.ts`.

## First-time setup

```bash
# 1. Install deps (one-time)
npm install

# 2. Make sure Postgres is running
npm run db:up

# 3. Apply migrations
npm run prisma:migrate -- --name init

# 4. (Optional) confirm the connection
npm run prisma:seed
```

## Common commands

| Command | What it does |
|---|---|
| `npm run prisma:format` | Reformat `schema.prisma`. Run before committing schema edits. |
| `npm run prisma:generate` | Regenerate the Prisma client into `node_modules/.prisma`. Auto-runs after `prisma:migrate`. |
| `npm run prisma:migrate -- --name <name>` | Create + apply a new migration in dev. |
| `npm run prisma:deploy` | Apply pending migrations in production (idempotent). |
| `npm run prisma:studio` | Open Prisma Studio (DB browser) on http://localhost:5555. |
| `npm run prisma:seed` | Run `prisma/seed.ts` against the current `DATABASE_URL`. |
| `npm run db:reset` | Wipe the local Postgres volume and start fresh. Destructive. |

## Using the client

```ts
import { db } from "@/lib/db"

export async function listPatients() {
  return db.patient.findMany({ orderBy: { createdAt: "desc" } })
}
```

The `db` export is a singleton — safe to import from anywhere, including server actions and route handlers. Do **not** instantiate `new PrismaClient()` directly elsewhere; it will exhaust the pool in dev.

## Migrations workflow

1. Edit `prisma/schema.prisma`.
2. Run `npm run prisma:format` to normalize style.
3. Run `npm run prisma:migrate -- --name <descriptive-name>` to create a migration.
4. Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`.
5. Commit both the schema change AND the migration directory.

In production:
- Migrations are applied via `npm run prisma:deploy` as part of the deploy step.
- Never run `prisma migrate dev` against production — it can prompt to reset.

## Models — what's coming

The schema starts empty. Models land in subsequent tasks:

| Task | Models |
|---|---|
| BE-03 | User, Role, Patient, Staff, Department, AuditLog |
| BE-13 | Consultation (RMO + Main) |
| BE-16 | LabResult |
| BE-24 | TreatmentPlan, PlanItem |
| BE-27 | Appointment |
| BE-37 | Invoice, InvoiceItem, Payment |
