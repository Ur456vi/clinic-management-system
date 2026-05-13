# Database setup

Vyara uses **PostgreSQL 16**. For local development we run it in Docker via `docker-compose.yml`. Production is expected to run on a managed Postgres (Neon, Supabase, AWS RDS, or similar).

## Prerequisites

- Docker Desktop (macOS / Windows) or Docker Engine + Compose plugin (Linux).
- A `.env.local` file at the repo root with at least `DATABASE_URL` set. See `.env.example`.

## Start the database

```bash
# Pull image + start Postgres in the background
docker compose up -d postgres

# Wait until it reports healthy
docker compose ps
```

Postgres will listen on `localhost:5432` by default with:

| Setting | Default |
|---------|---------|
| Database | `Vyara` |
| User | `postgres` |
| Password | `admin` |

The resulting connection string for `.env.local` is:

```
DATABASE_URL="postgresql://postgres:admin@localhost:5432/Vyara?schema=public"
```

## Optional: Adminer (web UI)

Adminer is a lightweight admin UI bundled in `docker-compose.yml` behind the `tools` profile, so it does not start by default.

```bash
docker compose --profile tools up -d adminer
# Open http://localhost:8080
#   System:   PostgreSQL
#   Server:   postgres
#   Username: postgres
#   Password: admin
#   Database: Vyara
```

## Stop / reset

```bash
docker compose stop postgres          # stop, keep data
docker compose down                   # stop + remove containers, keep data
docker compose down -v                # stop + remove containers AND DROP THE DATABASE VOLUME
```

The last command wipes `vyara_postgres_data` — useful when iterating on the schema before any production data exists, destructive after.

## Extensions

`docker/postgres/init/01-extensions.sql` runs on first container start (only when the data volume is empty) and enables:

- `uuid-ossp` — UUID generation for primary keys
- `citext` — case-insensitive text (emails, usernames)
- `pgcrypto` — `crypt()` / `gen_random_bytes()` for hashing helpers

If you ever wipe the volume, these will be re-enabled automatically on the next `up`.

## Production

For production, provision Postgres 16 on the managed provider of choice and set `DATABASE_URL` in the deployment environment. The same `01-extensions.sql` should be run once against the production database (most managed providers expose a SQL console for this, or you can run it via `psql "$DATABASE_URL" -f docker/postgres/init/01-extensions.sql`).

Recommended provider configuration:

- **Connection pooling** enabled (Vyara uses PrismaClient with default pool size).
- **Daily automated backups** with at least 7-day retention.
- **Point-in-time recovery** if the provider supports it.
- **TLS required** on the connection string (`?sslmode=require`).

## Smoke test

After `docker compose up -d postgres`:

```bash
# From the host
docker exec -it vyara-postgres psql -U postgres -d Vyara -c "SELECT version();"
```

Expect a row reporting `PostgreSQL 16.x ...`. If you see it, the database is ready for the Prisma migrations introduced in BE-02.

## Active local setup (as of 2026-05-13)

Dr. Yuvraj's workstation runs a native Postgres install (not the dockerized one in `docker-compose.yml`). The active credentials are:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `Vyara` (capital V) |
| User | `postgres` (the superuser) |
| Password | `admin` |

`.env.local` (gitignored) is pre-populated with the matching `DATABASE_URL`. `docker-compose.yml` defaults have also been aligned with these values, so dockerized and native runs use the same credentials interchangeably.
