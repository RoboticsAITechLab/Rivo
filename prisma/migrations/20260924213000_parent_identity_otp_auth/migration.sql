-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");
CREATE INDEX IF NOT EXISTS "parents_schoolId_phone_idx" ON "parents"("schoolId", "phone");
CREATE INDEX IF NOT EXISTS "parents_schoolId_email_idx" ON "parents"("schoolId", "email");

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('PHONE', 'EMAIL');

-- CreateTable
CREATE TABLE "auth_otps" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "consumed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_otps_identifier_type_idx" ON "auth_otps"("identifier", "type");
CREATE INDEX "auth_otps_expires_at_idx" ON "auth_otps"("expires_at");
