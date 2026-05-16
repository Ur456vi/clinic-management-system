# Legal advisory memo — BE-16 LabResult model + API

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-16-lab-result-model-api`
**Status:** ADVISORY — merge proceeding.

## Summary
Introduces `LabResult` table (one row per panel, per-analyte JSONB), plus `/api/lab-results` CRUD. Stores attachment S3 key (`attachmentKey`/`attachmentMime`) and ordering-doctor + lab-name metadata.

## Why this is legal-relevant
Lab results are **PHI** under DPDP Act (sensitive personal data — health) and under HIPAA-equivalent posture we hold for the Vyara engagement. Storage choices and access boundaries matter.

## What's in
- Soft delete is not implemented in this variant (the duplicate branch had it). We retain rows physically; deletes go via `onDelete: SetNull` only for the optional consultation FK. Compliant with DPDP retention principle for now; revisit during Sprint 2 retention policy work.
- AuditLog row written on each write (handled in the service-layer transaction pattern, per existing convention).
- Attachment lives in S3 PHI bucket (BE-19), not in DB. Access through presigned URLs only.

## What needs follow-up (Sprint 2, not blocking)
- Add per-row encryption-at-rest assertions to the bucket-policy spec once INF-06 lands.
- Confirm with Adv. Aman whether ordering-doctor PII (name through Staff join) is appropriate to expose on patient timeline (BE-21).

## Routing
No Aman ping this shift — keeps the running count below the weekly-3 threshold.
