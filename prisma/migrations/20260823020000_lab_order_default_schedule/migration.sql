-- Point the lab_orders.status default at PENDING_SCHEDULE.
--
-- Kept in its own migration (separate transaction) because Postgres forbids
-- using an enum value in the same transaction that ADD VALUE'd it — the value
-- was added in 20260823010000_lab_scheduling, which must commit first.
-- ADDITIVE / idempotent. Apply with `prisma migrate deploy`.

ALTER TABLE "lab_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING_SCHEDULE';
