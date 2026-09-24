-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('OWNER', 'PLATFORM_ADMIN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DIRECTOR';
ALTER TYPE "Role" ADD VALUE 'PRINCIPAL';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "platform_role" "PlatformRole";

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "school_id" DROP NOT NULL;

-- Backfill Platform Owner
UPDATE "users" SET "platform_role" = 'OWNER' WHERE "isPlatformOwner" = true;
