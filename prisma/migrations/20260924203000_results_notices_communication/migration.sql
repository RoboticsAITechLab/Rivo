-- CreateEnum
CREATE TYPE "ExamMarkStatus" AS ENUM ('PRESENT', 'ABSENT', 'NOT_ATTEMPTED', 'EXEMPT');

-- CreateEnum
CREATE TYPE "ExamResultOverallStatus" AS ENUM ('PASS', 'FAIL', 'COMPARTMENT', 'WITHHELD');

-- CreateEnum
CREATE TYPE "ResultPublicationStatus" AS ENUM ('DRAFT', 'CALCULATED', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SubjectResultStatus" AS ENUM ('PASS', 'FAIL', 'ABSENT', 'EXEMPT');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoticeTargetType" AS ENUM ('ALL_SCHOOL', 'CLASS', 'SECTION', 'TEACHERS', 'PARENTS', 'STUDENTS');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'NOTICE', 'RESULT', 'ATTENDANCE', 'EXAM');

-- CreateTable
CREATE TABLE "exam_marks" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "exam_term_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION,
    "max_marks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passing_marks" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "status" "ExamMarkStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "entered_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "exam_term_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "total_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_total_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" TEXT,
    "overall_status" "ExamResultOverallStatus" NOT NULL DEFAULT 'PASS',
    "status" "ResultPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by_user_id" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_result_subjects" (
    "id" TEXT NOT NULL,
    "exam_result_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION,
    "max_marks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passing_marks" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "grade" TEXT,
    "status" "SubjectResultStatus" NOT NULL DEFAULT 'PASS',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_result_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_audit_logs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "exam_term_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_user_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
    "target_type" "NoticeTargetType" NOT NULL DEFAULT 'ALL_SCHOOL',
    "class_id" TEXT,
    "section_id" TEXT,
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_read_statuses" (
    "id" TEXT NOT NULL,
    "notice_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_read_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_audit_logs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "notice_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_user_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_marks_paper_id_student_id_key" ON "exam_marks"("paper_id", "student_id");
CREATE INDEX "exam_marks_school_id_idx" ON "exam_marks"("school_id");
CREATE INDEX "exam_marks_exam_term_id_idx" ON "exam_marks"("exam_term_id");
CREATE INDEX "exam_marks_academic_session_id_idx" ON "exam_marks"("academic_session_id");
CREATE INDEX "exam_marks_student_id_idx" ON "exam_marks"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_exam_term_id_student_id_key" ON "exam_results"("exam_term_id", "student_id");
CREATE INDEX "exam_results_school_id_idx" ON "exam_results"("school_id");
CREATE INDEX "exam_results_academic_session_id_idx" ON "exam_results"("academic_session_id");
CREATE INDEX "exam_results_exam_term_id_idx" ON "exam_results"("exam_term_id");
CREATE INDEX "exam_results_student_id_idx" ON "exam_results"("student_id");
CREATE INDEX "exam_results_class_id_section_id_idx" ON "exam_results"("class_id", "section_id");
CREATE INDEX "exam_results_status_idx" ON "exam_results"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_result_subjects_exam_result_id_paper_id_key" ON "exam_result_subjects"("exam_result_id", "paper_id");
CREATE INDEX "exam_result_subjects_exam_result_id_idx" ON "exam_result_subjects"("exam_result_id");
CREATE INDEX "exam_result_subjects_paper_id_idx" ON "exam_result_subjects"("paper_id");
CREATE INDEX "exam_result_subjects_subject_id_idx" ON "exam_result_subjects"("subject_id");

-- CreateIndex
CREATE INDEX "result_audit_logs_school_id_idx" ON "result_audit_logs"("school_id");
CREATE INDEX "result_audit_logs_exam_term_id_idx" ON "result_audit_logs"("exam_term_id");

-- CreateIndex
CREATE INDEX "notices_school_id_idx" ON "notices"("school_id");
CREATE INDEX "notices_school_id_status_idx" ON "notices"("school_id", "status");
CREATE INDEX "notices_school_id_target_type_idx" ON "notices"("school_id", "target_type");
CREATE INDEX "notices_class_id_section_id_idx" ON "notices"("class_id", "section_id");
CREATE INDEX "notices_published_at_idx" ON "notices"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "notice_read_statuses_notice_id_user_id_key" ON "notice_read_statuses"("notice_id", "user_id");
CREATE INDEX "notice_read_statuses_notice_id_idx" ON "notice_read_statuses"("notice_id");
CREATE INDEX "notice_read_statuses_user_id_idx" ON "notice_read_statuses"("user_id");

-- CreateIndex
CREATE INDEX "notice_audit_logs_school_id_idx" ON "notice_audit_logs"("school_id");
CREATE INDEX "notice_audit_logs_notice_id_idx" ON "notice_audit_logs"("notice_id");

-- CreateIndex
CREATE INDEX "notifications_school_id_idx" ON "notifications"("school_id");
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_user_id_token_key" ON "device_tokens"("user_id", "token");
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_term_id_fkey" FOREIGN KEY ("exam_term_id") REFERENCES "exam_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_term_id_fkey" FOREIGN KEY ("exam_term_id") REFERENCES "exam_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_result_subjects" ADD CONSTRAINT "exam_result_subjects_exam_result_id_fkey" FOREIGN KEY ("exam_result_id") REFERENCES "exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_result_subjects" ADD CONSTRAINT "exam_result_subjects_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_result_subjects" ADD CONSTRAINT "exam_result_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_audit_logs" ADD CONSTRAINT "result_audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "result_audit_logs" ADD CONSTRAINT "result_audit_logs_exam_term_id_fkey" FOREIGN KEY ("exam_term_id") REFERENCES "exam_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notices" ADD CONSTRAINT "notices_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notices" ADD CONSTRAINT "notices_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_read_statuses" ADD CONSTRAINT "notice_read_statuses_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notice_read_statuses" ADD CONSTRAINT "notice_read_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audit_logs" ADD CONSTRAINT "notice_audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
