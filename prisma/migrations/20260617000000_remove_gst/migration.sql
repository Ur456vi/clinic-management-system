-- Remove GST entirely from the billing surface.
--
-- Drops the India-GST compliance fields (`gst_number`, `place_of_supply`,
-- `hsn_sac`) and every tax column (`tax_cents`, `tax_rate_bps`,
-- `line_tax_cents`). Invoice totals are now subtotal-only:
--   total_cents      == subtotal_cents
--   line_total_cents == line_subtotal_cents
-- The service layer no longer writes any tax value.

ALTER TABLE "invoices"
  DROP COLUMN "tax_cents",
  DROP COLUMN "gst_number",
  DROP COLUMN "place_of_supply";

ALTER TABLE "invoice_items"
  DROP COLUMN "hsn_sac",
  DROP COLUMN "tax_rate_bps",
  DROP COLUMN "line_tax_cents";
