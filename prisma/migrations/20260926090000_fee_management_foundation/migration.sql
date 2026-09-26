-- CreateEnum
CREATE TYPE "FeePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeePlanVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeeAssignmentStatus" AS ENUM ('ACTIVE', 'ADJUSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeObligationStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeePaymentMode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'DEMAND_DRAFT', 'OTHER');

-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('COLLECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FeeReceiptStatus" AS ENUM ('ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeAuditAction" AS ENUM ('FEE_HEAD_CREATED', 'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_PUBLISHED', 'PLAN_VERSIONED', 'ASSIGNMENT_CREATED', 'CONCESSION_APPLIED', 'OBLIGATION_GENERATED', 'PAYMENT_COLLECTED', 'PAYMENT_ALLOCATED', 'PAYMENT_REVERSED', 'RECEIPT_ISSUED', 'RECEIPT_CANCELLED');

-- CreateTable
CREATE TABLE "fee_heads" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_refundable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "class_id" TEXT NOT NULL,
    "stream_id" TEXT,
    "section_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "status" "FeePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plan_versions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "fee_plan_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "FeePlanVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plan_items" (
    "id" TEXT NOT NULL,
    "fee_plan_version_id" TEXT NOT NULL,
    "fee_head_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_installments" (
    "id" TEXT NOT NULL,
    "fee_plan_version_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "late_fee_fine_per_day" DECIMAL(10,2),
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_assignments" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "student_enrollment_id" TEXT NOT NULL,
    "fee_plan_version_id" TEXT NOT NULL,
    "custom_concession_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "concession_reason" TEXT,
    "concession_approved_by_user_id" TEXT,
    "assigned_by_user_id" TEXT NOT NULL,
    "status" "FeeAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_obligations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "student_enrollment_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "installment_id" TEXT,
    "title" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "original_amount" DECIMAL(12,2) NOT NULL,
    "concession_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "balance_amount" DECIMAL(12,2) NOT NULL,
    "status" "FeeObligationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "student_enrollment_id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" "FeePaymentMode" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "status" "FeePaymentStatus" NOT NULL DEFAULT 'COLLECTED',
    "reference_number" TEXT,
    "bank_name" TEXT,
    "cheque_date" TIMESTAMP(3),
    "remarks" TEXT,
    "collected_by_user_id" TEXT NOT NULL,
    "reversed_at" TIMESTAMP(3),
    "reversed_by_user_id" TEXT,
    "reversal_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payment_allocations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "obligation_id" TEXT NOT NULL,
    "allocated_amount" DECIMAL(12,2) NOT NULL,
    "is_reversed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_receipts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "student_enrollment_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL,
    "total_paid" DECIMAL(12,2) NOT NULL,
    "payment_mode" "FeePaymentMode" NOT NULL,
    "reference_number" TEXT,
    "student_snapshot" JSONB NOT NULL,
    "allocation_snapshot" JSONB NOT NULL,
    "issued_by_user_id" TEXT NOT NULL,
    "status" "FeeReceiptStatus" NOT NULL DEFAULT 'ISSUED',
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_user_id" TEXT,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_audit_logs" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "action" "FeeAuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "performed_by_user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_heads_school_id_idx" ON "fee_heads"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_heads_school_id_code_key" ON "fee_heads"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "fee_heads_school_id_name_key" ON "fee_heads"("school_id", "name");

-- CreateIndex
CREATE INDEX "fee_plans_school_id_academic_session_id_idx" ON "fee_plans"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "fee_plans_class_id_idx" ON "fee_plans"("class_id");

-- CreateIndex
CREATE INDEX "fee_plans_campus_id_idx" ON "fee_plans"("campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_plans_school_id_code_key" ON "fee_plans"("school_id", "code");

-- CreateIndex
CREATE INDEX "fee_plan_versions_school_id_idx" ON "fee_plan_versions"("school_id");

-- CreateIndex
CREATE INDEX "fee_plan_versions_fee_plan_id_idx" ON "fee_plan_versions"("fee_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_plan_versions_fee_plan_id_version_number_key" ON "fee_plan_versions"("fee_plan_id", "version_number");

-- CreateIndex
CREATE INDEX "fee_plan_items_fee_plan_version_id_idx" ON "fee_plan_items"("fee_plan_version_id");

-- CreateIndex
CREATE INDEX "fee_plan_items_fee_head_id_idx" ON "fee_plan_items"("fee_head_id");

-- CreateIndex
CREATE INDEX "fee_installments_fee_plan_version_id_idx" ON "fee_installments"("fee_plan_version_id");

-- CreateIndex
CREATE INDEX "fee_installments_due_date_idx" ON "fee_installments"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "fee_installments_fee_plan_version_id_installment_number_key" ON "fee_installments"("fee_plan_version_id", "installment_number");

-- CreateIndex
CREATE INDEX "student_fee_assignments_school_id_student_id_idx" ON "student_fee_assignments"("school_id", "student_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_student_enrollment_id_idx" ON "student_fee_assignments"("student_enrollment_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_academic_session_id_idx" ON "student_fee_assignments"("academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_assignments_student_enrollment_id_fee_plan_vers_key" ON "student_fee_assignments"("student_enrollment_id", "fee_plan_version_id");

-- CreateIndex
CREATE INDEX "fee_obligations_school_id_student_id_status_idx" ON "fee_obligations"("school_id", "student_id", "status");

-- CreateIndex
CREATE INDEX "fee_obligations_student_enrollment_id_due_date_idx" ON "fee_obligations"("student_enrollment_id", "due_date");

-- CreateIndex
CREATE INDEX "fee_obligations_assignment_id_idx" ON "fee_obligations"("assignment_id");

-- CreateIndex
CREATE INDEX "fee_obligations_academic_session_id_idx" ON "fee_obligations"("academic_session_id");

-- CreateIndex
CREATE INDEX "fee_payments_school_id_student_id_idx" ON "fee_payments"("school_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_payments_school_id_payment_date_idx" ON "fee_payments"("school_id", "payment_date");

-- CreateIndex
CREATE INDEX "fee_payments_academic_session_id_idx" ON "fee_payments"("academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_school_id_payment_number_key" ON "fee_payments"("school_id", "payment_number");

-- CreateIndex
CREATE INDEX "fee_payment_allocations_school_id_idx" ON "fee_payment_allocations"("school_id");

-- CreateIndex
CREATE INDEX "fee_payment_allocations_payment_id_idx" ON "fee_payment_allocations"("payment_id");

-- CreateIndex
CREATE INDEX "fee_payment_allocations_obligation_id_idx" ON "fee_payment_allocations"("obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payment_allocations_payment_id_obligation_id_key" ON "fee_payment_allocations"("payment_id", "obligation_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_receipts_payment_id_key" ON "fee_receipts"("payment_id");

-- CreateIndex
CREATE INDEX "fee_receipts_school_id_student_id_idx" ON "fee_receipts"("school_id", "student_id");

-- CreateIndex
CREATE INDEX "fee_receipts_receipt_date_idx" ON "fee_receipts"("receipt_date");

-- CreateIndex
CREATE INDEX "fee_receipts_academic_session_id_idx" ON "fee_receipts"("academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_receipts_school_id_receipt_number_key" ON "fee_receipts"("school_id", "receipt_number");

-- CreateIndex
CREATE INDEX "fee_audit_logs_school_id_created_at_idx" ON "fee_audit_logs"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "fee_audit_logs_entity_type_entity_id_idx" ON "fee_audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_versions" ADD CONSTRAINT "fee_plan_versions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_versions" ADD CONSTRAINT "fee_plan_versions_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_versions" ADD CONSTRAINT "fee_plan_versions_published_by_user_id_fkey" FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_items" ADD CONSTRAINT "fee_plan_items_fee_plan_version_id_fkey" FOREIGN KEY ("fee_plan_version_id") REFERENCES "fee_plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plan_items" ADD CONSTRAINT "fee_plan_items_fee_head_id_fkey" FOREIGN KEY ("fee_head_id") REFERENCES "fee_heads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_installments" ADD CONSTRAINT "fee_installments_fee_plan_version_id_fkey" FOREIGN KEY ("fee_plan_version_id") REFERENCES "fee_plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_fee_plan_version_id_fkey" FOREIGN KEY ("fee_plan_version_id") REFERENCES "fee_plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "student_fee_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "fee_installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_collected_by_user_id_fkey" FOREIGN KEY ("collected_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_reversed_by_user_id_fkey" FOREIGN KEY ("reversed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payment_allocations" ADD CONSTRAINT "fee_payment_allocations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "fee_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_audit_logs" ADD CONSTRAINT "fee_audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_audit_logs" ADD CONSTRAINT "fee_audit_logs_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
