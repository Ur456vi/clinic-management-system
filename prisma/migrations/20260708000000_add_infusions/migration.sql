-- CreateTable
CREATE TABLE "infusions" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "eventful" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infusions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "infusions_patient_id_date_idx" ON "infusions"("patient_id", "date" DESC);

-- AddForeignKey
ALTER TABLE "infusions" ADD CONSTRAINT "infusions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infusions" ADD CONSTRAINT "infusions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
