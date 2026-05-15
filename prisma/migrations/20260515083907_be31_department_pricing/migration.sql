-- BE-31: add default service pricing column to departments.
--
-- JSONB map of `serviceCode -> priceCents` (integer paise). NULL means
-- "no defaults configured yet"; an empty object `{}` is permitted and
-- has the same operational meaning. BE-37 will migrate values out of
-- this column into a normalised `ServicePrice` table.
ALTER TABLE "departments"
  ADD COLUMN "default_pricing" JSONB;
