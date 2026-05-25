-- Add avatar_url to patients table so patient-portal users can upload a profile photo.
-- Mirrors the existing staff.avatar_url column (S3 object key, nullable when no avatar).
ALTER TABLE "patients" ADD COLUMN "avatar_url" TEXT;
