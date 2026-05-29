-- AlterTable: link an appointment to the consultation started from it (1:1).
ALTER TABLE "appointments" ADD COLUMN "consultation_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_consultation_id_key" ON "appointments"("consultation_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
