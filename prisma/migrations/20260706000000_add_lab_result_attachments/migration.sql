-- CreateTable
CREATE TABLE "lab_result_attachments" (
    "id" UUID NOT NULL,
    "lab_result_id" UUID NOT NULL,
    "attachment_key" TEXT NOT NULL,
    "attachment_mime" TEXT,
    "filename" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_result_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_result_attachments_lab_result_id_created_at_idx" ON "lab_result_attachments"("lab_result_id", "created_at");

-- AddForeignKey
ALTER TABLE "lab_result_attachments" ADD CONSTRAINT "lab_result_attachments_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
