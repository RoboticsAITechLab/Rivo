-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_registers_schoolId_date_idx" ON "attendance_registers"("schoolId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_enrollments_schoolId_classId_sectionId_status_idx" ON "student_enrollments"("schoolId", "classId", "sectionId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "fee_obligations_schoolId_studentEnrollmentId_status_idx" ON "fee_obligations"("school_id", "student_enrollment_id", "status");
