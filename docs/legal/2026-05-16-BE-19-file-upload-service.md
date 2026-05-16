# Legal advisory memo — BE-19 file upload service (S3 presigned)

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-19-file-upload-service`
**Status:** ADVISORY — merge proceeding.

## Summary
Presigned-URL upload/download endpoints over `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. Two buckets: `phi` (private medical) and `assets` (semi-public). Read from env `AWS_S3_BUCKET_PHI`, `AWS_S3_BUCKET_ASSETS`.

## Why this is legal-relevant
Direct browser → S3 upload of PHI (lab PDFs, photos). The signing surface IS the access-control boundary.

## What's in
- URL TTL: short-lived (per service docblock).
- Object never traverses the Node runtime — reduces our PHI exposure window.
- Validation module (`lib/validation/file.ts`) gates mimetype + size before signing.

## What needs follow-up (Sprint 2)
- Bucket policy: ensure PHI bucket is `BlockPublicAccess: true` + SSE-S3/KMS — confirm in INF-06 spec.
- Logging: object-level CloudTrail data events for the PHI bucket (DPDP audit trail).
- Verify presign role uses scoped IAM (PutObject/GetObject only on these prefixes) before INF goes live.

## Routing
No Aman ping; advisory only.
