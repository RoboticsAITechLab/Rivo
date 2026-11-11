# RIVO — Database & Data Architecture

> **Last Verified:** November 11, 2026  
> **ORM Engine:** Prisma ORM 6.19.3  
> **Database Host:** PostgreSQL (Neon Serverless)  
> **Scale:** 67 Models, 30 Enums, 14 Chronological Migrations

---

## 1. Executive Summary

Rivo's relational data model is managed through **Prisma ORM** targeting **PostgreSQL**. The schema spans 12 business domains:
1. Multi-Tenancy & Institutional Hierarchy (`School`, `Campus`, `AcademicSession`, `SchoolSetting`, `IdSequence`, `IdFormatConfig`)
2. Identity, RBAC & Security Infrastructure (`User`, `SchoolMembership`, `Session`, `Permission`, `CustomRole`, `RolePermission`, `UserPermissionOverride`, `StaffInvitation`, `PasswordResetToken`, `SecurityAuditLog`, `UserMfa`, `MfaRecoveryCode`, `MfaChallenge`, `AuthOtp`)
3. Academic Core (`Class`, `Section`, `Subject`)
4. Student & Guardian Information (`Student`, `StudentDocument`, `Parent`, `ParentStudent`, `StudentEnrollment`)
5. Staff & Faculty Management (`Teacher`, `TeacherDocument`, `TeacherAssignment`)
6. Timetable & Scheduling (`TimetableConfig`, `PeriodDefinition`, `TimetableSlot`)
7. Attendance (`AttendanceRegister`, `AttendanceRecord`, `AttendanceAuditLog`)
8. Examination & Results Subsystem (`ExamTerm`, `ExamPaper`, `ExamSchedule`, `ExamMark`, `ExamResult`, `ExamResultSubject`, `ResultAuditLog`)
9. Homework (`Homework`)
10. Fee & Financial Ledger (`FeeHead`, `FeePlan`, `FeePlanVersion`, `FeePlanItem`, `FeeInstallment`, `StudentFeeAssignment`, `FeeObligation`, `FeePayment`, `FeePaymentAllocation`, `FeeReceipt`, `FeeAuditLog`)
11. Communication & Push Notifications (`Notice`, `NoticeReadStatus`, `NoticeAuditLog`, `Notification`, `DeviceToken`)
12. Testing, Observability & Diagnostic Engine (`TestRun`, `TestCaseResult`, `TestMetric`, `ServiceHealthCheck`, `TestArtifact`, `TestCleanupTask`)

---

## 2. Multi-Tenancy & Referential Integrity

- **Tenant Isolation:** Enforced via `schoolId String` on all core entities.
- **Cascade Deletions (`110 relations`):** Safe cascading for internal parent-child entities (`School -> Campuses`, `Class -> Sections`, `FeePlanVersion -> FeePlanItems`).
- **Restrict Deletions (`26 relations`):** Strict `onDelete: Restrict` guards on financial records (`FeeObligation`, `FeePayment`, `FeeReceipt`) and active student enrollments, making accidental permanent data destruction virtually impossible.
- **State Machine Deletion:** Replaces generic `deletedAt` soft deletes with explicit state machine transitions (`CANCELLED`, `REVERSED`, `TRANSFERRED`).

---

## 3. Database Documentation Map

- [DATABASE_SCHEMA.md](file:///d:/Rivo/docs/DATABASE/DATABASE_SCHEMA.md) — Complete catalog of all 67 models and 30 enums with field definitions.
- [ENTITY_RELATIONSHIPS.md](file:///d:/Rivo/docs/DATABASE/ENTITY_RELATIONSHIPS.md) — Mermaid entity relationship diagrams, foreign keys, and indexes.
- [MIGRATIONS.md](file:///d:/Rivo/docs/DATABASE/MIGRATIONS.md) — Chronological history of all 14 database migrations.

