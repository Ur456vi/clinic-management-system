# Legal advisory memo — BE-37 Invoice + Payment models

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-37-invoice-model`
**Status:** ADVISORY — merge proceeding.

## Summary
Adds `Invoice`, `InvoiceItem`, `Payment` models + `/api/invoices` CRUD + `/api/invoices/:id/payments`. Money in integer cents; tax in basis points. Status transitions gated by `ALLOWED_INVOICE_TRANSITIONS`. All writes in `db.$transaction` with AuditLog.

## Why this is legal-relevant
Billing surface — GST invoice numbering, payment-gateway records (Razorpay-mock now), financial audit trail.

## Notes
- AuditLog wrapping is in place.
- Status state machine blocks back-dating CAPTURED → PENDING.
- Payment row append-only; invoice status derived from captured-payment sum.

## Follow-up
- GST invoice-number sequencing (monotonic per fiscal year) — needs clinic-scoped counter. Sprint 2.
- Razorpay test → live cutover: BAA / merchant-agreement update — Aman reviews when live keys arrive.
- Refund flow deferred.

## Cross-week posture
Weekly memo count crosses 3 with this batch — PM Agent to send Aman a single digest after the shift report.
