# Database Entity Relationships & Constraints

> **Last Verified:** November 11, 2026  
> **Source Target:** `prisma/schema.prisma`

---

## 1. High-Level Entity Relationship Diagram

```mermaid
erDiagram
    School ||--o{ Campus : contains
    School ||--o{ AcademicSession : schedules
    School ||--o{ SchoolMembership : enrolls
    School ||--o{ Student : registers
    School ||--o{ Teacher : employs
    School ||--o{ Class : defines
    School ||--o{ FeePlan : structures
    School ||--o{ FeePayment : collects

    User ||--o{ SchoolMembership : holds
    User ||--o{ Session : opens
    User ||--o{ UserMfa : configures

    Class ||--o{ Section : divides
    Class ||--o{ StudentEnrollment : categorizes

    Student ||--o{ StudentEnrollment : tracks
    Student ||--o{ ParentStudent : links
    Parent ||--o{ ParentStudent : links

    StudentEnrollment ||--o{ StudentFeeAssignment : assigns
    StudentFeeAssignment ||--o{ FeeObligation : incurs
    FeePlan ||--o{ FeePlanVersion : versions
    FeePlanVersion ||--o{ FeePlanItem : itemizes
    FeePlanVersion ||--o{ FeeInstallment : schedules

    FeePayment ||--o{ FeePaymentAllocation : allocates
    FeeObligation ||--o{ FeePaymentAllocation : settles
    FeePayment ||--|| FeeReceipt : issues

    Teacher ||--o{ TeacherAssignment : teaches
    Section ||--o{ TeacherAssignment : assigned_to
    Subject ||--o{ TeacherAssignment : covers

    Section ||--o{ AttendanceRegister : takes
    AttendanceRegister ||--o{ AttendanceRecord : records
    Student ||--o{ AttendanceRecord : evaluates

    AcademicSession ||--o{ ExamTerm : cycles
    ExamTerm ||--o{ ExamPaper : defines
    ExamPaper ||--o{ ExamSchedule : schedules
    ExamPaper ||--o{ ExamMark : scores
    Student ||--o{ ExamMark : receives
    ExamTerm ||--o{ ExamResult : aggregates
    Student ||--o{ ExamResult : earns
```

---

## 2. Foreign Key Cascade vs Restrict Rules

### 2.1 Cascade Deletions (`onDelete: Cascade` — 110 Relations)
- Deleting a `School` cascades down to all child memberships, students, teachers, campuses, sessions, classes, and notices.
- Deleting a `User` cascades to user MFA credentials, sessions, and school memberships.
- Parent-child collections cascade cleanly:
  - `Class -> Section`
  - `TimetableConfig -> PeriodDefinition`
  - `FeePlanVersion -> FeePlanItem`
  - `ExamTerm -> ExamPaper`
  - `ExamResult -> ExamResultSubject`

### 2.2 Restrict Deletions (`onDelete: Restrict` — 26 Relations)
- **Financial Shielding:** Deleting a `Student` or `StudentEnrollment` is blocked if `FeeObligation`, `FeePayment`, or `FeeReceipt` records exist.
- **Audit Shielding:** Records cannot be deleted if referenced in `FeeAuditLog` (`performedByUser`), `FeePayment` (`collectedByUser`), or `StaffInvitation` (`invitedBy`).
- **Academic Shielding:** Classes and sections cannot be deleted if active `StudentEnrollment` records reference them.

---

## 3. Composite Indexes & Optimization (34 Composite Indexes)

Added primarily in migration `20260926233000_performance_composite_indexes`:
1. `attendance_registers(schoolId, date)`: Optimizes daily attendance roster queries.
2. `student_enrollments(schoolId, classId, sectionId, status)`: Speeds up class roster and student count queries.
3. `fee_obligations(schoolId, studentEnrollmentId, status)`: Accelerates dues calculations and fee payment collection lookups.
4. `timetable_slots(teacherId, dayOfWeek)`: Resolves teacher timetable collision lookups in $< 1\text{ ms}$.
5. `timetable_slots(classId, sectionId, dayOfWeek)`: Resolves cohort collision lookups.

