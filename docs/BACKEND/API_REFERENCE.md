# Complete Backend API Reference

> **Last Verified:** November 11, 2026  
> **Total Endpoints:** 74+ Active Production Endpoints  
> **Source Directory:** `apps/web/src/app/api`

---

## 1. Authentication & Identity (`/api/auth/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | POST | Public | Scrypt password login; rate-limited via Redis; returns session cookie or MFA challenge. |
| `/api/auth/signup/admin` | POST | Public | Self-service institutional onboarding creating School, User, Membership, Campus, and Session. |
| `/api/auth/logout` | POST | Authenticated | Revokes active session in PostgreSQL and invalidates Redis cache; clears cookie. |
| `/api/auth/logout-all` | POST | Authenticated | Revokes all active sessions for authenticated user; invalidates all cache. |
| `/api/auth/me` | GET | Authenticated | Resolves current authenticated identity, profile, permissions, active school. |
| `/api/auth/sessions` | GET, DELETE | Authenticated | Lists active sessions; DELETE terminates specific session or all other sessions. |
| `/api/auth/forgot-password` | POST | Public | Rate-limited password recovery request; issues token and dispatches email via Resend. |
| `/api/auth/reset-password` | POST | Public | Verifies reset token, validates password complexity, updates password, revokes all sessions. |
| `/api/auth/mfa/enroll` | GET, POST | Authenticated | GET generates TOTP secret & QR code; POST verifies initial OTP, activates MFA, returns 10 recovery codes. |
| `/api/auth/mfa/verify` | POST | Authenticated / Challenge | Verifies TOTP or recovery code; upgrades pending session to fully authenticated. |
| `/api/auth/mfa/challenge` | POST | Authenticated | Issues MFA challenge during login. |
| `/api/auth/mfa/disable` | POST | Authenticated | Requires password re-authentication before disabling MFA. |
| `/api/auth/mfa/recovery-codes` | GET, POST | Authenticated | Generates / regenerates hashed recovery backup codes. |
| `/api/auth/parent/otp/request` | POST | Public | 6-digit OTP generation with 60s cooldown and 5-min expiry for parent phone/email login. |
| `/api/auth/parent/otp/verify` | POST | Public | Verifies OTP code, validates attempt limits (max 5), resolves children, issues session. |
| `/api/auth/parent/select-school`| POST | Parent Role | Switches active tenant context for multi-school parents. |
| `/api/auth/parent/me` | GET | Parent Role | Returns parent profile, active school, and linked children summaries. |

---

## 2. School Governance & Settings (`/api/school/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/school/profile` | GET, PUT | Admin / Director | Retrieves and updates school profile (name, affiliation, address, timezone). |
| `/api/school/branding` | GET, PUT | Admin / Director | Institutional branding assets (logos, seals, signatures, document headers/footers). |
| `/api/school/branding/logo` | POST, DELETE | Admin / Director | Direct logo asset update and deletion. |
| `/api/school/id-config` | GET, PUT | Admin / Director | Student/staff ID auto-generation format (prefixes, padding, year rules). |
| `/api/school/roles` | GET, POST | Director / Owner Only | Role management: lists roles; POST creates custom role with permissions. |
| `/api/school/roles/[id]` | GET, PUT, DELETE | Director / Owner Only | Custom role inspection, update, and safe deletion. |
| `/api/school/roles/permissions`| GET | Admin / Director | Returns system permissions catalog grouped by module. |
| `/api/school/settings` | GET, PUT | Admin / Director | Central category-based settings hub (attendance, fees, security, etc.). |
| `/api/school/settings/overview`| GET | Admin / Director | High-level summary of configured modules and activation state. |
| `/api/school/settings/teacher-documents` | GET, PUT | Admin / Director | Configures mandatory and optional teacher verification document types. |
| `/api/school/dashboard` | GET | Authenticated | Real-time school dashboard KPIs (enrolment, staff count, fee collections). |
| `/api/school/data/import` | POST | Admin / Director | Bulk CSV import with dry-run validation and atomic transactional persistence. |
| `/api/school/data/export` | POST | Admin / Director | Export students, classes, subjects, teachers in JSON or CSV. |

---

## 3. Academic Structure (`/api/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/academic-sessions` | GET, POST | Admin / Director | Lists and creates academic sessions. Supports `makeCurrent` activation. |
| `/api/academic-sessions/[id]` | GET, PUT, DELETE | Admin / Director | Academic session detail, update, and deletion. |
| `/api/campuses` | GET, POST | Admin / Director | Multi-campus directory and branch creation. |
| `/api/campuses/[id]` | GET, PUT, DELETE | Admin / Director | Campus detail, update, and deletion. |
| `/api/classes` | GET, POST | Admin / Director | Class master listing and creation with automatic section creation. |
| `/api/classes/[id]` | GET, PUT, DELETE | Admin / Director | Class detail, display order update, and safe deletion. |
| `/api/sections` | GET, POST | Admin / Director | Section management per class with capacity thresholds. |
| `/api/sections/[id]` | GET, PUT, DELETE | Admin / Director | Section update and deletion. |
| `/api/streams` | GET, POST | Admin / Director | Senior secondary academic streams (Science, Commerce, Arts). |
| `/api/subjects` | GET, POST | Admin / Director | Subject master catalog and creation with subject codes. |
| `/api/subjects/[id]` | GET, PUT, DELETE | Admin / Director | Subject update and deletion. |
| `/api/houses` | GET, POST | Admin / Director | Student house allocation system. |

---

## 4. Student Management (`/api/students/*` & `/api/parent/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/students` | GET, POST | `students.view`, `students.create` | GET searches and filters students; POST executes atomic intake transaction. |
| `/api/students/next-id` | GET | `students.create` | Pre-fetches next sequential admission number for intake form. |
| `/api/students/photo/upload` | POST | `students.create` | Direct avatar upload with magic-byte and 2MB validation. |
| `/api/students/rolls/preview` | GET, POST | `students.edit` | Previews alphabetical roll number assignments with manual preservation. |
| `/api/students/rolls/rebalance`| POST | `students.edit` | Transactionally commits rebalanced roll numbers with audit logging. |
| `/api/students/[id]` | GET, PATCH, DELETE | `students.view`, `students.edit` | Comprehensive student profile; PATCH updates; DELETE archives. |
| `/api/students/[id]/documents`| GET, POST | `students.edit` | Manages student verification documents (Birth Certificate, TC). |
| `/api/students/[id]/documents/[docId]` | GET, DELETE | `students.edit` | Document inspection and deletion. |
| `/api/students/[id]/photo` | POST, DELETE | `students.edit` | Updates or removes student profile picture. |
| `/api/parents` | GET, POST | `parents.view` | Parent master directory and creation. |
| `/api/parents/[id]` | GET, PATCH, DELETE | `parents.edit` | Parent profile management and child linking. |
| `/api/parent/children` | GET | Parent Role | Lists authorized linked children with enrollment details. |
| `/api/parent/children/[id]/fees` | GET | Parent Role | Lists fee obligations, breakdown, and payment history for specific child. |
| `/api/parent/children/[id]/receipts/[receiptId]/pdf` | GET | Parent Role | Strict child-ownership verified fee receipt PDF download. |
| `/api/parent/device-token` | POST | Parent Role | Registers mobile push notification token. |

---

## 5. Faculty & Staff Management (`/api/teachers/*` & `/api/teacher/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/teachers` | GET, POST | `teachers.view`, `teachers.create` | GET lists faculty; POST runs atomic faculty onboarding transaction. |
| `/api/teachers/next-id` | GET | `teachers.create` | Pre-fetches next sequential teacher employee ID. |
| `/api/teachers/photo/upload` | POST | `teachers.create` | Faculty photo upload with Azure Blob integration. |
| `/api/teachers/[id]` | GET, PATCH, DELETE | `teachers.view`, `teachers.edit` | Faculty profile, assignments, status updates, deletion. |
| `/api/teachers/[id]/documents` | GET, POST | `teachers.edit` | Faculty KYC documents (Aadhaar, Degree certificates). |
| `/api/teachers/[id]/documents/[docId]` | DELETE | `teachers.edit` | Document deletion. |
| `/api/teachers/[id]/documents/[docId]/verify` | POST, PATCH | Admin / Director | Administrative document verification and status update. |
| `/api/teachers/[id]/permissions` | GET, POST | Admin / Director | Explicit granular `UserPermissionOverride` assignment for teacher. |
| `/api/teachers/[id]/photo` | POST, DELETE | `teachers.edit` | Photo updates and removals. |
| `/api/teacher/attendance` | GET, POST | Teacher Role | Faculty personal attendance records. |
| `/api/teacher/dashboard` | GET | Teacher Role | Faculty workspace summary (today's schedule, pending marks). |
| `/api/teacher/documents` | GET, POST | Teacher Role | Self-service document upload portal for teachers. |

---

## 6. Financial Ledger & Fees Engine (`/api/fees/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/fees/heads` | GET, POST | `fees.head_view`, `fees.head_create` | Fee heads master (Tuition, Transport, Lab, Admission) with refundable flags. |
| `/api/fees/heads/[id]` | PATCH, DELETE | `fees.head_edit` | Fee head updates and safe deletion. |
| `/api/fees/plans` | GET, POST | `fees.plan_view`, `fees.plan_create` | Annual fee plan creation with versioning. Validates item and installment sums. |
| `/api/fees/plans/[id]` | GET, PATCH | `fees.plan_view`, `fees.plan_edit` | Fee plan inspection and draft modifications. |
| `/api/fees/plans/[id]/publish` | POST | `fees.plan_publish` | Atomically publishes plan version, locks version from future edits. |
| `/api/fees/plans/[id]/versions`| POST | `fees.plan_create` | Creates new version increment (e.g. v2) preserving previous history. |
| `/api/fees/assign` | POST | `fees.assign` | Assigns published plan to cohorts, generating `FeeObligation` installments. |
| `/api/fees/obligations` | GET | `fees.obligation_view` | Queries outstanding and settled student obligations with balance filters. |
| `/api/fees/concessions` | GET, POST | `fees.concession_apply` | Applies institutional concessions/scholarships reducing net obligation. |
| `/api/fees/concessions/[id]/reverse` | POST | `fees.concession_reverse` | Reverses applied concession restoring original obligation balance. |
| `/api/fees/payments` | GET, POST | `fees.payment_record` | Records payment atomically: non-overpayment check, allocations, receipt generation. |
| `/api/fees/payments/[id]` | GET | `fees.payment_view` | Detailed payment inspection with allocation breakdown. |
| `/api/fees/payments/[id]/reverse` | POST | `fees.payment_reverse` | Reverses payment: flags REVERSED, cancels receipt, restores obligations. |
| `/api/fees/receipts` | GET | `fees.receipt_view` | Lists issued and cancelled fee receipts. |
| `/api/fees/receipts/[id]` | GET | `fees.receipt_view` | Receipt detail with snapshot data. |
| `/api/fees/receipts/[id]/pdf` | GET | `fees.receipt_download` | Server-side vector PDF generation using `pdf-lib` returning binary PDF. |
| `/api/fees/stats` | GET | `fees.stats_view` | Real-time financial metrics (total billed, collected, outstanding, collection rate). |
| `/api/fees/audit` | GET | `fees.audit_view` | Immutable financial audit log trail. |

---

## 7. Operations: Attendance, Timetable & Homework

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/attendance` | GET, POST | `attendance.view`, `attendance.take` | GET returns attendance roster; POST atomically records attendance. |
| `/api/timetable/config` | GET, POST | `timetable.config` | Working days, periods per day, timing configuration. |
| `/api/timetable/school` | GET, POST, DELETE | `timetable.view`, `timetable.edit` | School timetable grid; validates teacher/cohort/room clashes. |
| `/api/timetable/exam` | GET, POST, PATCH, DELETE | `exams.view`, `exams.edit` | Examination terms and date-sheets. |
| `/api/timetable/exam/papers` | GET, POST, DELETE | `exams.edit` | Exam paper configurations (max marks, passing marks, duration). |
| `/api/timetable/exam/schedule` | POST, DELETE | `exams.edit` | Exam slot and venue scheduling with conflict checks. |
| `/api/timetable/exam/print-data` | GET | `exams.view` | Formatted print data for student hall tickets and date sheets. |
| `/api/homework` | GET, POST | `homework.view`, `homework.create` | Homework assignments with cohort counts and attachment rules. |
| `/api/homework/submit` | POST | Authenticated | Student homework turn-in with deadline enforcement. |
| `/api/notices` | GET, POST | `notices.view`, `notices.create` | Audience-targeted announcements (ALL_SCHOOL, TEACHERS, PARENTS). |
| `/api/notices/[id]/publish` | POST | `notices.publish` | Transitions notice to PUBLISHED and triggers in-app / email dispatcher. |
| `/api/notices/[id]/archive` | POST | `notices.edit` | Archives notice. |
| `/api/notices/[id]/read` | POST | Authenticated | Marks notice as read for authenticated user. |
| `/api/notifications` | GET | Authenticated | Lists user notifications with unread counts. |
| `/api/notifications/read-all`| POST | Authenticated | Marks all notifications as read. |
| `/api/communication/groups` | GET | `communication.view` | Lists pre-computed communication distribution groups. |

---

## 8. Results & Tabulation (`/api/results/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/results/terms` | GET | `results.view` | Lists examination terms for results entry. |
| `/api/results/marks` | GET, POST | `results.marks_entry` | GET loads marks roster; POST validates scores ($\le$ max) and saves in transaction. |
| `/api/results/calculate` | POST | `results.calculate` | Aggregates marks, computes percentage/GPA, applies CBSE grading, records results. |
| `/api/results/publish` | POST | `results.publish` | Publishes results making them visible to students/parents and locking marks. |
| `/api/results/class/[classId]` | GET | `results.view` | Class-wide broadsheet / ledger view. |
| `/api/results/student/[studentId]` | GET | `results.view` | Single student report card with subject breakdown. |

---

## 9. Media & Diagnostics (`/api/media/*` & `/api/testing-center/*`)

| Endpoint | Method | Role / Guard | Description |
| :--- | :---: | :--- | :--- |
| `/api/media/sas/upload` | POST | Authenticated | Generates short-lived (15 min) write-only Azure Blob SAS token for client uploads. |
| `/api/testing-center/health` | GET | Platform Operator | Diagnostic health checks against PostgreSQL, Redis, Azure Blob, and Email. |
| `/api/testing-center/execute` | POST | Platform Operator | Executes automated diagnostic test suites (functional, browser, synthetic). |
| `/api/testing-center/regression` | GET, POST | Platform Operator | Runs end-to-end regression validation across all core ERP workflows. |
| `/api/testing-center/load-test` | POST | Platform Operator | Concurrent synthetic load simulation testing API latency and DB throughput. |
| `/api/testing-center/cancel` | POST | Platform Operator | Cancels in-flight test runs. |
| `/api/testing-center/cleanup` | GET, POST | Platform Operator | Cleans up synthetic test tenant artifacts. |
| `/api/testing-center/runs` | GET | Platform Operator | Lists diagnostic execution runs with status and metrics. |
| `/api/testing-center/runs/[id]`| GET | Platform Operator | Detailed run log and test assertions. |
| `/api/testing-center/runs/[id]/export` | GET | Platform Operator | Exports test run report in JSON/CSV. |
| `/api/testing-center/metrics` | GET | Platform Operator | Aggregate test pass/fail metrics and execution timings. |

