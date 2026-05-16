# Legal advisory memo — BE-19 file upload service (S3 presigned)

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-19-file-upload-service`
**Status:** ADVISORY — merge proceeding.

## Summary
Presigned-URL upload/download endpoints over `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. Two buckets: `phi` (private medical) and `assets` (semi-public). Bucket names from env.

## Why this is legal-relevant
Direct browser → S3 upload of PHI. The signing surface IS the access-control boundary.

## Notes
- Short-lived URLs (per docblock).
- Object never traverses Node runtime — shrinks PHI exposure.
- `lib/validation/file.ts` gates mimetype + size pre-sign.

## Follow-up (Sprint 2)
- PHI bucket policy: `BlockPublicAccess: true` + SSE-S3/KMS — confirmed in INF-06.
- CloudTrail object-level data events on PHI bucket (DPDP audit trail).
- Scoped IAM (`PutObject`/`GetObject` only, prefix-restricted) for the signing role.
