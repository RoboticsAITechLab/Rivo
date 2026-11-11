# Chronological Database Migrations History

> **Last Verified:** November 11, 2026  
> **Source Directory:** `prisma/migrations`  
> **Total Migrations:** 14 Chronological PostgreSQL Migrations

---

## 1. Migration Timeline Overview

| # | Migration Directory | SQL File Size | Core Schema Modifications |
| :-: | :--- | :--- | :--- |
| **1** | `20260916145540_init_foundation` | 2.2 KB | Initial baseline schema. Created `schools`, `users`, `school_memberships`, enums `Role` and `SchoolStatus`. Established compound unique index on `[userId, schoolId]`. |
| **2** | `20260918131500_step6_academic_foundation` | 10.4 KB | Academic core: created `students`, `parents`, `parent_students`, `teachers`, `academic_sessions`, `classes`, `sections`, `subjects`, and `student_enrollments`. Established tenant keys. |
| **3** | `20260923224500_role_architecture_rework` | 0.4 KB | Added `PlatformRole` enum (`OWNER`, `PLATFORM_ADMIN`). Added `users.platform_role` column. Made `sessions.school_id` nullable for cross-tenant platform operator access. |
| **4** | `20260924203000_results_notices_communication` | 12.8 KB | Introduced exam grading and communication subsystems: `exam_marks`, `exam_results`, `exam_result_subjects`, `result_audit_logs`, `notices`, `notice_read_statuses`, `notifications`, `device_tokens`. |
| **5** | `20260924213000_parent_identity_otp_auth` | 1.1 KB | Identity verification: added `auth_otps` table and `OtpType` enum for passwordless/OTP mobile login for parents and staff. |
| **6** | `20260926090000_fee_management_foundation` | 20.6 KB | Largest financial migration (470 lines). Introduced 8 enums and 11 fee tables (`fee_heads`, `fee_plans`, `fee_plan_versions`, `fee_obligations`, `fee_payments`, `fee_receipts`, etc.) with strict `onDelete: Restrict` guards. |
| **7** | `20260926194500_student_photo_url` | 0.1 KB | Schema enhancement: added `photo_url TEXT` to `students` table for student ID cards and portal display. |
| **8** | `20260926233000_performance_composite_indexes` | 0.5 KB | Performance patch: added 3 composite indexes across attendance registers, student enrollments, and fee obligations. |
| **9** | `20260929200000_school_settings_configuration_center` | 1.1 KB | Config engine: created `school_settings` table with compound unique constraint on `[school_id, category]`. |
| **10** | `20260929210000_alphabetical_roll_number_mode` | 0.1 KB | Academic enhancement: added `roll_number_mode VARCHAR(20) DEFAULT 'AUTO'` to `student_enrollments` for automated alphabetical roll number generation. |
| **11** | `20260930210000_teacher_documents_foundation` | 0.7 KB | Created `teacher_documents` table with basic foreign key linkage to `teachers`. |
| **12** | `20260930220000_teacher_legal_documents` | 1.8 KB | Compliance expansion: extended `teacher_documents` with `school_id`, verification workflow columns (`verified_by_id`, `verified_at`, `status`), and composite indexes. |
| **13** | `20261008200000_homework_system` | 2.0 KB | Coursework module: created `homework` table with foreign key relations to classes, sections, subjects, teachers, and sessions. |
| **14** | `20261009220000_testing_observability_center` | 5.2 KB | Diagnostic engine: created 6 tables (`test_runs`, `test_case_results`, `test_metrics`, `service_health_checks`, `test_artifacts`, `test_cleanup_tasks`) to support automated CI/CD and self-healing test runs. |

---

## 2. Migration Execution Commands

```bash
# Apply pending migrations to database (uses DIRECT_URL on port 5432)
npm run prisma:migrate:deploy

# Validate schema integrity against current database
npm run prisma:validate
```

