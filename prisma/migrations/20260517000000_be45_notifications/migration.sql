-- BE-45: Notification model + in-app delivery.
--
-- One row per fan-out delivery. `userId` is the recipient; the table
-- carries staff *and* patient notifications because both login types
-- share the `users` table. `sourceType` + `sourceRefId` is a polymorphic
-- back-reference (no FK) so any emitter can stamp the originating
-- entity without coupling the schema.
--
-- Idempotency on the `(userId, kind, sourceType, sourceRefId)` tuple is
-- handled in the service layer (`emitNotification`) — we deliberately do
-- NOT add a unique constraint here because `GENERIC` notifications and
-- emitters that legitimately omit `sourceType`/`sourceRefId` must remain
-- additive.

-- =========================================================================
-- Enum
-- =========================================================================

CREATE TYPE "NotificationKind" AS ENUM (
  'HANDOFF',
  'APPOINTMENT_REMINDER',
  'INVOICE_ISSUED',
  'PAYMENT_RECEIVED',
  'PLAN_SIGNED',
  'GENERIC'
);

-- =========================================================================
-- notifications
-- =========================================================================

CREATE TABLE "notifications" (
  "id"            UUID               NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       UUID               NOT NULL,
  "kind"          "NotificationKind" NOT NULL,
  "title"         TEXT               NOT NULL,
  "body"          TEXT,
  "source_type"   TEXT,
  "source_ref_id" UUID,
  "read_at"       TIMESTAMPTZ,
  "created_at"    TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Recipient feed query: "give me my notifications, newest first,
-- optionally filtered to unread". The composite index covers the
-- (userId, readAt IS NULL, createdAt DESC) access pattern.
CREATE INDEX "notifications_user_id_read_at_created_at_idx"
  ON "notifications"("user_id", "read_at", "created_at" DESC);

-- Backreference lookup: "find any notification I already emitted for
-- this (sourceType, sourceRefId)" — powers `emitNotification`
-- idempotency.
CREATE INDEX "notifications_source_type_source_ref_id_idx"
  ON "notifications"("source_type", "source_ref_id");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
