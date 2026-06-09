-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_reset_password" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "vitals" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "recorded_by_id" UUID,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "heart_rate" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "temperature_f" DOUBLE PRECISION,
    "spo2" INTEGER,
    "notes" TEXT,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vitals_patient_id_recorded_at_idx" ON "vitals"("patient_id", "recorded_at" DESC);

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

