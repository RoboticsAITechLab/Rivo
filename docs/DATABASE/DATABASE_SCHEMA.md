# Complete Database Schema Reference

> **Last Verified:** November 11, 2026  
> **Source Target:** `prisma/schema.prisma` (72.3 KB)  
> **Scale:** 67 Models, 30 Enums

---

## 1. Complete Catalog of All 30 Enums

```typescript
// 1. Platform Operator Hierarchy
enum PlatformRole { OWNER, PLATFORM_ADMIN }

// 2. School-Level Roles
enum Role {
  DIRECTOR, PRINCIPAL, ADMIN, TEACHER, FEE_MANAGER, STAFF, STUDENT, PARENT,
  SCHOOL_ADMIN, // Backward-compatible alias
  OWNER         // Backward-compatible alias
}

// 3. User Account Lifecycle
enum UserStatus { ACTIVE, INVITED, SUSPENDED, DISABLED }

// 4. Institutional Membership State
enum MembershipStatus { ACTIVE, INACTIVE, SUSPENDED }

// 5. School Tenant Lifecycle
enum SchoolStatus { TRIAL, ACTIVE, SUSPENDED, ARCHIVED }

// 6. Student Academic Status
enum StudentStatus { ACTIVE, INACTIVE, GRADUATED, SUSPENDED, TRANSFERRED }

// 7. Faculty Employment Status
enum TeacherStatus { ACTIVE, ON_LEAVE, INACTIVE, TERMINATED }

// 8. Academic Session Lifecycle
enum AcademicSessionStatus { UPCOMING, ACTIVE, ARCHIVED }

// 9. Student Enrollment Status
enum EnrollmentStatus { ACTIVE, COMPLETED, TRANSFERRED, WITHDRAWN }

// 10. Parent-Student Relationship
enum ParentRelationship { FATHER, MOTHER, GUARDIAN, OTHER }

// 11. Attendance Marking
enum AttendanceStatus { PRESENT, ABSENT, LATE, LEAVE, EXCUSED }

// 12. Exam Paper Attempt Status
enum ExamMarkStatus { PRESENT, ABSENT, NOT_ATTEMPTED, EXEMPT }

// 13. Terminal Exam Overall Performance
enum ExamResultOverallStatus { PASS, FAIL, COMPARTMENT, WITHHELD }

// 14. Exam Result Publication Lifecycle
enum ResultPublicationStatus { DRAFT, CALCULATED, PUBLISHED, WITHDRAWN }

// 15. Individual Subject Result Grade
enum SubjectResultStatus { PASS, FAIL, ABSENT, EXEMPT }

// 16. School Notice Lifecycle
enum NoticeStatus { DRAFT, PUBLISHED, ARCHIVED }

// 17. Notice Priority Tiers
enum NoticePriority { LOW, NORMAL, HIGH, URGENT }

// 18. Notice Audience Targeting
enum NoticeTargetType { ALL_SCHOOL, CLASS, SECTION, TEACHERS, PARENTS, STUDENTS }

// 19. Notification Topic Category
enum NotificationCategory { GENERAL, NOTICE, RESULT, ATTENDANCE, EXAM }

// 20. Granular RBAC Permission Scope
enum PermissionScope { SCHOOL, CAMPUS, ASSIGNED, OWN }

// 21. Timetable Period Classification
enum PeriodType { TEACHING, BREAK, LUNCH, ASSEMBLY, ACTIVITY }

// 22. Multi-Factor OTP Channel
enum OtpType { PHONE, EMAIL }

// 23. Fee Plan Lifecycle
enum FeePlanStatus { DRAFT, ACTIVE, ARCHIVED }

// 24. Fee Plan Versioning Lifecycle
enum FeePlanVersionStatus { DRAFT, PUBLISHED, ARCHIVED }

// 25. Student Fee Plan Assignment State
enum FeeAssignmentStatus { ACTIVE, ADJUSTED, CANCELLED }

// 26. Fee Installment Obligation State
enum FeeObligationStatus { PENDING, PARTIALLY_PAID, PAID, OVERDUE, WAIVED, CANCELLED }

// 27. Payment Method Channels
enum FeePaymentMode { CASH, UPI, BANK_TRANSFER, CHEQUE, DEMAND_DRAFT, OTHER }

// 28. Payment Transaction State
enum FeePaymentStatus { COLLECTED, REVERSED }

// 29. Financial Receipt Validity
enum FeeReceiptStatus { ISSUED, CANCELLED }

// 30. Financial Ledger Audit Action
enum FeeAuditAction {
  FEE_HEAD_CREATED, PLAN_CREATED, PLAN_UPDATED, PLAN_PUBLISHED, PLAN_VERSIONED,
  ASSIGNMENT_CREATED, CONCESSION_APPLIED, OBLIGATION_GENERATED, PAYMENT_COLLECTED,
  PAYMENT_ALLOCATED, PAYMENT_REVERSED, RECEIPT_ISSUED, RECEIPT_CANCELLED
}
```

---

## 2. Complete Model Catalog (67 Models)

### Domain 1: Multi-Tenancy & Institutional Structure (6 Models)
- **`School`**: Root tenant model. Fields: `id`, `name`, `slug` (UK), `status`, `address`, `phone`, `email`, `website`, `logoUrl`, `timezone`, timestamps.
- **`Campus`**: Physical school branch. Fields: `id`, `schoolId`, `name`, `code`, `address`, `isMain`, `status`. Unique: `@@unique([schoolId, name])`.
- **`AcademicSession`**: Academic year cycle. Fields: `id`, `schoolId`, `name`, `startDate`, `endDate`, `status`, `isCurrent`. Unique: `@@unique([schoolId, name])`.
- **`SchoolSetting`**: Category-based settings JSON. Fields: `id`, `schoolId`, `category`, `data` (Json), `updatedById`, timestamps. Unique: `@@unique([schoolId, category])`.
- **`IdSequence`**: Atomic sequential counter. Fields: `id`, `schoolId`, `entityType`, `year`, `currentValue`, `updatedAt`. Unique: `@@unique([schoolId, entityType, year])`.
- **`IdFormatConfig`**: Tenant formatting rules. Fields: `id`, `schoolId` (UK), `studentPrefix`, `teacherPrefix`, `includeYear`, `paddingLength`.

### Domain 2: Identity, RBAC & Security (14 Models)
- **`User`**: Global user identity. Fields: `id`, `email` (UK), `phone` (UK), `passwordHash`, `platformRole`, `isActive`, `status`, timestamps.
- **`SchoolMembership`**: Tenant user membership. Fields: `id`, `userId`, `schoolId`, `role`, `customRoleId`, `status`. Unique: `@@unique([userId, schoolId])`.
- **`Session`**: Database-backed session. Fields: `id`, `userId`, `schoolId` (nullable), `tokenHash` (UK), `expiresAt`, `revokedAt`, `ipAddress`, `userAgent`.
- **`Permission`**: System permission catalog. Fields: `id`, `code` (UK), `module`, `action`, `name`, `description`.
- **`CustomRole`**: Tenant custom roles. Fields: `id`, `schoolId`, `name`, `code`, `baseRole`, `isSystem`, `isActive`. Unique: `@@unique([schoolId, code])`.
- **`RolePermission`**: Role-to-permission mapping. Fields: `id`, `roleId`, `permissionId`, `scope`. Unique: `@@unique([roleId, permissionId])`.
- **`UserPermissionOverride`**: Explicit user grants. Fields: `id`, `userId`, `permissionId`, `schoolId`, `isGranted`, `scope`. Unique: `@@unique([userId, permissionId])`.
- **`StaffInvitation`**: Onboarding invitation links. Fields: `id`, `schoolId`, `email`, `role`, `tokenHash` (UK), `expiresAt`, `status`, `invitedById`.
- **`PasswordResetToken`**: Password recovery tokens. Fields: `id`, `userId`, `tokenHash` (UK), `expiresAt`, `usedAt`.
- **`SecurityAuditLog`**: Security event trail. Fields: `id`, `userId`, `schoolId`, `event`, `ipAddress`, `userAgent`, `metadata` (Json), `createdAt`.
- **`UserMfa`**: MFA configuration. Fields: `id`, `userId` (UK), `isEnabled`, `totpSecret` (Encrypted), `createdAt`.
- **`MfaRecoveryCode`**: Backup recovery codes. Fields: `id`, `userMfaId`, `codeHash` (UK), `usedAt`.
- **`MfaChallenge`**: Two-step verification challenges. Fields: `id`, `userId`, `challengeToken` (UK), `expiresAt`.
- **`AuthOtp`**: One-time passwords for mobile. Fields: `id`, `identifier`, `otpHash`, `type`, `expiresAt`, `attempts`.

### Domain 3: Academic Core Structure (3 Models)
- **`Class`**: Grade/Standard. Fields: `id`, `schoolId`, `campusId`, `name`, `displayOrder`. Unique: `@@unique([schoolId, name])`.
- **`Section`**: Division within class. Fields: `id`, `schoolId`, `classId`, `name`, `capacity`. Unique: `@@unique([classId, name])`.
- **`Subject`**: Curricular discipline. Fields: `id`, `schoolId`, `name`, `code`. Unique: `@@unique([schoolId, name])`.

### Domain 4: Student & Guardian Information (5 Models)
- **`Student`**: Master student record. Fields: `id`, `schoolId`, `admissionNumber`, `legalName`, `dob`, `gender`, `bloodGroup`, `photoUrl`, `house`, `stream`, `status`. Unique: `@@unique([schoolId, admissionNumber])`.
- **`StudentDocument`**: Student attachments. Fields: `id`, `studentId`, `title`, `type`, `fileUrl`, `fileSize`, `mimeType`, `createdAt`.
- **`Parent`**: Guardian profile. Fields: `id`, `schoolId`, `userId` (nullable), `name`, `relation`, `phone`, `email`, `occupation`.
- **`ParentStudent`**: Guardian-student link. Fields: `id`, `parentId`, `studentId`, `isPrimaryContact`. Unique: `@@unique([parentId, studentId])`.
- **`StudentEnrollment`**: Class registration. Fields: `id`, `schoolId`, `studentId`, `academicSessionId`, `classId`, `sectionId`, `rollNumber`, `rollNumberMode`, `status`. Unique: `@@unique([studentId, academicSessionId])`.

### Domain 5: Staff & Faculty Management (3 Models)
- **`Teacher`**: Faculty record. Fields: `id`, `schoolId`, `userId` (UK), `campusId`, `employeeId`, `department`, `designation`, `qualifications`, `status`. Unique: `@@unique([schoolId, employeeId])`.
- **`TeacherDocument`**: KYC/compliance files. Fields: `id`, `teacherId`, `schoolId`, `title`, `type`, `fileUrl`, `status`, `verifiedById`, `verifiedAt`.
- **`TeacherAssignment`**: Teaching allocations. Fields: `id`, `schoolId`, `teacherId`, `academicSessionId`, `classId`, `sectionId`, `subjectId`, `isClassTeacher`. Unique: `@@unique([teacherId, academicSessionId, classId, sectionId, subjectId])`.

### Domain 6: Timetable & Scheduling (3 Models)
- **`TimetableConfig`**: Timetable settings. Fields: `id`, `schoolId`, `academicSessionId`, `campusId`, `name`, `workingDays`, `periodsPerDay`.
- **`PeriodDefinition`**: Period specifications. Fields: `id`, `configId`, `periodNumber`, `name`, `type`, `startTime`, `endTime`. Unique: `@@unique([configId, periodNumber])`.
- **`TimetableSlot`**: Weekly grid entries. Fields: `id`, `schoolId`, `academicSessionId`, `classId`, `sectionId`, `dayOfWeek`, `periodNumber`, `subjectId`, `teacherId`, `roomNumber`. Unique: `@@unique([academicSessionId, classId, sectionId, dayOfWeek, periodNumber])`.

### Domain 7: Attendance Subsystem (3 Models)
- **`AttendanceRegister`**: Daily roll roster. Fields: `id`, `schoolId`, `academicSessionId`, `classId`, `sectionId`, `date`, `subjectId`, `takenById`. Unique: `@@unique([schoolId, academicSessionId, classId, sectionId, date, subjectId])`.
- **`AttendanceRecord`**: Individual student mark. Fields: `id`, `registerId`, `studentId`, `status`, `remarks`. Unique: `@@unique([registerId, studentId])`.
- **`AttendanceAuditLog`**: Retroactive edit trail. Fields: `id`, `schoolId`, `recordId`, `previousStatus`, `newStatus`, `reason`, `updatedById`.

### Domain 8: Examination & Results (7 Models)
- **`ExamTerm`**: Examination term. Fields: `id`, `schoolId`, `academicSessionId`, `name`, `startDate`, `endDate`, `status`. Unique: `@@unique([schoolId, academicSessionId, name])`.
- **`ExamPaper`**: Subject test paper. Fields: `id`, `examTermId`, `subjectId`, `title`, `maxMarks`, `passingMarks`, `weightage`.
- **`ExamSchedule`**: Date sheet schedule. Fields: `id`, `paperId`, `classId`, `sectionId`, `examDate`, `startTime`, `endTime`, `roomNumber`. Unique: `@@unique([paperId, classId, sectionId])`.
- **`ExamMark`**: Student paper score. Fields: `id`, `schoolId`, `paperId`, `studentId`, `marksObtained`, `status`, `enteredById`. Unique: `@@unique([paperId, studentId])`.
- **`ExamResult`**: Calculated scorecard. Fields: `id`, `schoolId`, `examTermId`, `studentId`, `totalMarks`, `maxTotalMarks`, `percentage`, `grade`, `gpa`, `overallStatus`, `status`. Unique: `@@unique([examTermId, studentId])`.
- **`ExamResultSubject`**: Subject scorecard row. Fields: `id`, `examResultId`, `paperId`, `marksObtained`, `maxMarks`, `grade`, `status`. Unique: `@@unique([examResultId, paperId])`.
- **`ResultAuditLog`**: Result audit trail. Fields: `id`, `schoolId`, `examTermId`, `action`, `performedById`, `metadata` (Json), `createdAt`.

### Domain 9: Homework Subsystem (1 Model)
- **`Homework`**: Coursework assignments. Fields: `id`, `schoolId`, `academicSessionId`, `classId`, `sectionId`, `subjectId`, `teacherId`, `title`, `description`, `attachments` (Json), `dueDate`, `createdAt`.

### Domain 10: Fee & Financial Ledger (11 Models)
- **`FeeHead`**: Ledger heads. Fields: `id`, `schoolId`, `name`, `code`, `isRefundable`, `isTaxable`. Unique: `@@unique([schoolId, code])`, `@@unique([schoolId, name])`.
- **`FeePlan`**: Annual fee plans. Fields: `id`, `schoolId`, `academicSessionId`, `classId`, `name`, `code`, `status`. Unique: `@@unique([schoolId, code])`.
- **`FeePlanVersion`**: Plan versions. Fields: `id`, `feePlanId`, `versionNumber`, `totalAmount`, `status`, `publishedAt`. Unique: `@@unique([feePlanId, versionNumber])`.
- **`FeePlanItem`**: Plan line items. Fields: `id`, `feePlanVersionId`, `feeHeadId`, `amount`.
- **`FeeInstallment`**: Payment schedules. Fields: `id`, `feePlanVersionId`, `installmentNumber`, `dueDate`, `amount`, `percentage`. Unique: `@@unique([feePlanVersionId, installmentNumber])`.
- **`StudentFeeAssignment`**: Student plan bindings. Fields: `id`, `schoolId`, `studentEnrollmentId`, `feePlanVersionId`, `customConcessionPercentage`, `status`. Unique: `@@unique([studentEnrollmentId, feePlanVersionId])`.
- **`FeeObligation`**: Installment obligations. Fields: `id`, `schoolId`, `studentFeeAssignmentId`, `studentId`, `installmentNumber`, `dueDate`, `originalAmount`, `concessionAmount`, `netAmount`, `paidAmount`, `balanceAmount`, `status`.
- **`FeePayment`**: Payment transactions. Fields: `id`, `schoolId`, `paymentNumber`, `studentId`, `amount`, `paymentMode`, `referenceNumber`, `status`, `collectedByUserId`, `createdAt`. Unique: `@@unique([schoolId, paymentNumber])`.
- **`FeePaymentAllocation`**: Double-entry splits. Fields: `id`, `paymentId`, `obligationId`, `amount`. Unique: `@@unique([paymentId, obligationId])`.
- **`FeeReceipt`**: Issued tax receipts. Fields: `id`, `schoolId`, `receiptNumber`, `paymentId`, `studentSnapshot` (Json), `status`, `issuedByUserId`, `createdAt`. Unique: `@@unique([schoolId, receiptNumber])`.
- **`FeeAuditLog`**: Financial audit log. Fields: `id`, `schoolId`, `action`, `entityType`, `entityId`, `performedByUserId`, `details` (Json), `createdAt`.

### Domain 11: Communication & Push Notifications (5 Models)
- **`Notice`**: Circular bulletins. Fields: `id`, `schoolId`, `title`, `content`, `targetType`, `priority`, `status`, `publishedAt`, `authorId`.
- **`NoticeReadStatus`**: Read tracking. Fields: `id`, `noticeId`, `userId`, `readAt`. Unique: `@@unique([noticeId, userId])`.
- **`NoticeAuditLog`**: Notice audit trail. Fields: `id`, `schoolId`, `noticeId`, `action`, `performedById`, `createdAt`.
- **`Notification`**: In-app notifications. Fields: `id`, `schoolId`, `userId`, `title`, `message`, `category`, `isRead`, `linkUrl`, `createdAt`.
- **`DeviceToken`**: Push tokens (FCM/APNS). Fields: `id`, `userId`, `token`, `platform`, `updatedAt`. Unique: `@@unique([userId, token])`.

### Domain 12: Testing, Observability & Diagnostic Engine (6 Models)
- **`TestRun`**: Automated test run sessions. Fields: `id`, `suiteName`, `targetUrl`, `environment`, `status`, `totalTests`, `passedTests`, `failedTests`, `durationMs`, `passRate`, `createdAt`.
- **`TestCaseResult`**: Granular test assertions. Fields: `id`, `testRunId`, `testName`, `endpoint`, `method`, `status`, `statusCode`, `durationMs`, `evidence` (Json).
- **`TestMetric`**: Telemetry benchmarks. Fields: `id`, `testRunId`, `metricKey`, `metricValue`, `unit`, `tags` (Json).
- **`ServiceHealthCheck`**: Component heartbeats. Fields: `id`, `serviceName`, `status`, `responseTimeMs`, `details` (Json), `createdAt`.
- **`TestArtifact`**: Captured logs and dumps. Fields: `id`, `testRunId`, `artifactType`, `fileUrl`.
- **`TestCleanupTask`**: Mock tenant teardown tasks. Fields: `id`, `testRunId`, `tenantSlug`, `status`.

