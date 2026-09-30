-- AlterTable
ALTER TABLE "teacher_documents"
    ADD COLUMN IF NOT EXISTS "school_id" TEXT,
    ADD COLUMN IF NOT EXISTS "category" TEXT,
    ADD COLUMN IF NOT EXISTS "document_number" TEXT,
    ADD COLUMN IF NOT EXISTS "storage_key" TEXT,
    ADD COLUMN IF NOT EXISTS "mime_type" TEXT,
    ADD COLUMN IF NOT EXISTS "issue_date" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "expiry_date" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "verified_by_id" TEXT,
    ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "verification_note" TEXT,
    ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "is_required" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Populate school_id from teachers table if missing
UPDATE "teacher_documents" td
SET "school_id" = t."schoolId"
FROM "teachers" t
WHERE td."teacher_id" = t."id" AND td."school_id" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "teacher_documents_school_id_idx" ON "teacher_documents"("school_id");
CREATE INDEX IF NOT EXISTS "teacher_documents_category_idx" ON "teacher_documents"("category");
CREATE INDEX IF NOT EXISTS "teacher_documents_status_idx" ON "teacher_documents"("status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
