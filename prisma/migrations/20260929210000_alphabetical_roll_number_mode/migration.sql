-- AlterTable
ALTER TABLE "student_enrollments" ADD COLUMN IF NOT EXISTS "roll_number_mode" VARCHAR(20) DEFAULT 'AUTO' NOT NULL;
