-- Per-user notification preferences (email-alert toggles).
-- JSONB map of `channel -> boolean`; NULL = all-on defaults.
ALTER TABLE "users" ADD COLUMN "notification_prefs" JSONB;
