-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "department_id" UUID;

-- CreateIndex
CREATE INDEX "invoices_department_id_idx" ON "invoices"("department_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
