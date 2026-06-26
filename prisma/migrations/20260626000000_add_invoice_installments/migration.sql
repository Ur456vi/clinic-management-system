-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "installment_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "installment_plan" JSONB;
