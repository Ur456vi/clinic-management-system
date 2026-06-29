-- CreateTable
CREATE TABLE "clinical_summaries" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_summary_files" (
    "id" UUID NOT NULL,
    "summary_id" UUID NOT NULL,
    "attachment_key" TEXT NOT NULL,
    "attachment_mime" TEXT,
    "filename" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_summary_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_summaries_patient_id_summary_date_idx" ON "clinical_summaries"("patient_id", "summary_date" DESC);

-- CreateIndex
CREATE INDEX "clinical_summary_files_summary_id_created_at_idx" ON "clinical_summary_files"("summary_id", "created_at");

-- AddForeignKey
ALTER TABLE "clinical_summaries" ADD CONSTRAINT "clinical_summaries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_summaries" ADD CONSTRAINT "clinical_summaries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_summary_files" ADD CONSTRAINT "clinical_summary_files_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "clinical_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
