-- CreateEnum
CREATE TYPE "RefillRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'FULFILLED', 'DECLINED');

-- CreateTable
CREATE TABLE "refill_requests" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "plan_item_id" UUID,
    "item_name" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "note" TEXT,
    "status" "RefillRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_id" UUID,
    "decided_by_id" UUID,
    "decision_note" TEXT,
    "approved_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refill_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refill_requests_patient_id_status_idx" ON "refill_requests"("patient_id", "status");

-- CreateIndex
CREATE INDEX "refill_requests_status_created_at_idx" ON "refill_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "treatment_plan_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

