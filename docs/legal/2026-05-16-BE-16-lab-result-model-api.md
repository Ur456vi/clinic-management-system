# Legal advisory memo — BE-16 LabResult model + API

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-16-lab-result-model-api`
**Status:** ADVISORY — merge proceeding.

## Summary
Introduces `LabResult` table (one row per panel, per-analyte JSONB), plus `/api/lab-results` CRUD. Stores attachment S3 key (`attachmentKey` / `attachmentMime`) and ordering-doctor + lab-name metadata.

## Why this is legal-relevant
Lab results are PHI under DPDP Act (sensitive personal data — health). Storage shape and access boundary matter.

## Notes
- AuditLog row written on each write (service-layer transaction pattern).
- Attachment lives in S3 PHI bucket (BE-19); access through presigned URLs only.
- Soft-delete absent in this variant — physical retention OK for now; revisit Sprint 2 retention.

## Follow-up (Sprint 2, non-blocking)
- Per-row encryption-at-rest assertions on bucket policy once INF-06 lands.
- Confirm with Aman whether ordering-doctor PII may surface on patient-side timeline.
