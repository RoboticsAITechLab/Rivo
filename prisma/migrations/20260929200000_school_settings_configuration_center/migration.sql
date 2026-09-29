-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_settings_school_id_idx" ON "school_settings"("school_id");

-- CreateIndex
CREATE INDEX "school_settings_school_id_category_idx" ON "school_settings"("school_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_school_id_category_key" ON "school_settings"("school_id", "category");

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
