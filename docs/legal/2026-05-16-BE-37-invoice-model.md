# Legal advisory memo — BE-37 Invoice + Payment models

**Date:** 2026-05-16
**Author:** PM Agent (Sprint 1 advisory, non-blocking)
**Branch:** `task/BE-37-invoice-model`
**Status:** ADVISORY — merge proceeding.

## Summary
Adds `Invoice`, `InvoiceItem`, `Payment` models + `/api/invoices` CRUD + `/api/invoices/:id/payments`. Money stored as integer cents; tax in basis points (e.g. 1800 = 18% GST). Status transitions gated by `ALLOWED_INVOICE_TRANSITIONS`. All writes in `db.$transaction` with AuditLog row.

## Why this is legal-relevant
Billing surface — GST invoice numbering rules (CGST/SGST), payment-gateway records (Razorpay-mock now, real later in Sprint 2), and financial audit trail.

## What's in
- AuditLog wraps writes — good for SOX-style trace.
- Status state machine prevents back-dating CAPTURED → PENDING.
- Payment row is append-only conceptually; invoice status derives from sum of CAPTURED payments.

## What needs follow-up
- GST invoice-number sequencing: ensure monotonically increasing per fiscal year (statutory) — implementation likely needs a clinic-scoped counter table. Sprint 2.
- Razorpay test → live cutover: BAA / merchant-agreement update (Aman to review when Razorpay live keys arrive).
- Refund flow not in this PR (deferred).

## Routing
No Aman ping; advisory only. Will batch with BE-16 + BE-19 + handoff/timeline this week — total this calendar week = 5 memos. **Cross the weekly-3 threshold this week — ping Aman with a digest email after the shift report goes out.**
