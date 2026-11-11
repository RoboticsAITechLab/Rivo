# Frontend Routes & Pages Inventory

> **Last Verified:** November 11, 2026  
> **Total Frontend Pages:** 67 Distinct App Router Pages  
> **Source Directory:** `apps/web/src/app`

---

## 1. Global & Root Routes

| Route | Page File | Access Scope | Description |
| :--- | :--- | :--- | :--- |
| `/` | `apps/web/src/app/page.tsx` | Public | Root redirect; forwards to `/login` |
| `/access-denied` | `apps/web/src/app/access-denied/page.tsx` | Public | 403 Forbidden boundary fallback page |

---

## 2. Authentication Gateway `(auth)`

All routes wrapped in `apps/web/src/app/(auth)/layout.tsx`:

| Route | Page File | Description |
| :--- | :--- | :--- |
| `/login` | `apps/web/src/app/(auth)/login/page.tsx` | Password login with TOTP MFA challenge & emergency backup code fallbacks |
| `/signup` | `apps/web/src/app/(auth)/signup/page.tsx` | Multi-step school admin registration wizard |
| `/forgot-password` | `apps/web/src/app/(auth)/forgot-password/page.tsx` | Password recovery request form |
| `/reset-password` | `apps/web/src/app/(auth)/reset-password/page.tsx` | Token-verified password reset form |
| `/verify-email` | `apps/web/src/app/(auth)/verify-email/page.tsx` | Email activation token handler |
| `/invite/accept` | `apps/web/src/app/(auth)/invite/accept/page.tsx` | Faculty/staff invitation onboarding form |

---

## 3. School Admin OS `(school)`

All routes wrapped in `apps/web/src/app/(school)/school/layout.tsx` with `AuthGuard` and `AppShell`:

### Core Operational Dashboards
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school` | `apps/web/src/app/(school)/school/page.tsx` | Executive Dashboard: KPI metrics, enrollment trends, attention items |
| `/school/attendance` | `apps/web/src/app/(school)/school/attendance/page.tsx` | Daily roll-call attendance register & stats |
| `/school/classes` | `apps/web/src/app/(school)/school/classes/page.tsx` | Academic grade & section management |
| `/school/communication/groups`| `apps/web/src/app/(school)/school/communication/groups/page.tsx` | Communication groups manager |
| `/school/homework` | `apps/web/src/app/(school)/school/homework/page.tsx` | Homework assignment & review queue |
| `/school/notices` | `apps/web/src/app/(school)/school/notices/page.tsx` | School notice board & broadcast circulars |
| `/school/notifications` | `apps/web/src/app/(school)/school/notifications/page.tsx` | Admin notification stream & alerts |
| `/school/results` | `apps/web/src/app/(school)/school/results/page.tsx` | Marks entry, moderation review & publishing |
| `/school/subjects` | `apps/web/src/app/(school)/school/subjects/page.tsx` | Subjects curriculum catalog |
| `/school/timetable` | `apps/web/src/app/(school)/school/timetable/page.tsx` | Master weekly timetable matrix |

### Student Management
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school/students` | `apps/web/src/app/(school)/school/students/page.tsx` | Student directory & 360° profile drawer |
| `/school/students/new` | `apps/web/src/app/(school)/school/students/new/page.tsx` | 6-step Student Admission Workspace |

### Faculty & Staff Management
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school/teachers` | `apps/web/src/app/(school)/school/teachers/page.tsx` | Faculty directory, card & table view |
| `/school/teachers/new` | `apps/web/src/app/(school)/school/teachers/new/page.tsx` | Faculty onboarding workspace |
| `/school/teachers/[id]` | `apps/web/src/app/(school)/school/teachers/[id]/page.tsx` | Faculty profile, assignments & workload |
| `/school/teachers/[id]/edit` | `apps/web/src/app/(school)/school/teachers/[id]/edit/page.tsx` | Edit faculty personal/employment details |
| `/school/teachers/[id]/permissions` | `apps/web/src/app/(school)/school/teachers/[id]/permissions/page.tsx` | Granular faculty permissions editor |

### Formal Examination Center
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school/exams` | `apps/web/src/app/(school)/school/exams/page.tsx` | Examination terms & status management |
| `/school/exams/roll-numbers` | `apps/web/src/app/(school)/school/exams/roll-numbers/page.tsx` | Exam roll number generation & rebalancing |
| `/school/exams/[id]` | `apps/web/src/app/(school)/school/exams/[id]/page.tsx` | Exam term details & papers summary |
| `/school/exams/[id]/documents` | `apps/web/src/app/(school)/school/exams/[id]/documents/page.tsx` | Printable admit cards & hall tickets |
| `/school/exams/[id]/schedule` | `apps/web/src/app/(school)/school/exams/[id]/schedule/page.tsx` | Exam schedule builder & venue allocation |

### Fee Management Subsystem
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school/fees` | `apps/web/src/app/(school)/school/fees/page.tsx` | Fee Financial Dashboard & Collections |
| `/school/fees/assignments` | `apps/web/src/app/(school)/school/fees/assignments/page.tsx` | Assign fee plans to cohorts |
| `/school/fees/audit` | `apps/web/src/app/(school)/school/fees/audit/page.tsx` | Financial transaction audit trail |
| `/school/fees/concessions` | `apps/web/src/app/(school)/school/fees/concessions/page.tsx` | Concessions & scholarship allocation |
| `/school/fees/heads` | `apps/web/src/app/(school)/school/fees/heads/page.tsx` | Fee head ledger definitions |
| `/school/fees/payments` | `apps/web/src/app/(school)/school/fees/payments/page.tsx` | Payments ledger & reversal actions |
| `/school/fees/payments/new` | `apps/web/src/app/(school)/school/fees/payments/new/page.tsx` | Record fee collection payment workflow |
| `/school/fees/payments/[id]` | `apps/web/src/app/(school)/school/fees/payments/[id]/page.tsx` | Individual payment transaction details |
| `/school/fees/plans` | `apps/web/src/app/(school)/school/fees/plans/page.tsx` | Annual fee structures catalog |
| `/school/fees/plans/new` | `apps/web/src/app/(school)/school/fees/plans/new/page.tsx` | Fee plan creation wizard |
| `/school/fees/plans/[id]` | `apps/web/src/app/(school)/school/fees/plans/[id]/page.tsx` | Fee plan editor & installment breakdown |
| `/school/fees/receipts` | `apps/web/src/app/(school)/school/fees/receipts/page.tsx` | Fee receipts archive |
| `/school/fees/receipts/[id]` | `apps/web/src/app/(school)/school/fees/receipts/[id]/page.tsx` | Official fee receipt printable view |
| `/school/fees/students/[studentId]` | `apps/web/src/app/(school)/school/fees/students/[studentId]/page.tsx` | 360° student fee ledger & obligations |

### Settings Control Center (Flat Routes)
| Route | Page File | Description |
| :--- | :--- | :--- |
| `/school/settings` | `apps/web/src/app/(school)/school/settings/page.tsx` | Settings Control Center Overview |
| `/school/settings/academic-sessions` | `.../settings/academic-sessions/page.tsx` | Academic sessions management |
| `/school/settings/attendance` | `.../settings/attendance/page.tsx` | Attendance policy configuration |
| `/school/settings/branding` | `.../settings/branding/page.tsx` | Logo, colors & institutional branding |
| `/school/settings/campuses` | `.../settings/campuses/page.tsx` | Multi-campus physical locations |
| `/school/settings/classes` | `.../settings/classes/page.tsx` | Classes & sections settings |
| `/school/settings/data/export` | `.../settings/data/export/page.tsx` | Data export runner & format options |
| `/school/settings/data/import` | `.../settings/data/import/page.tsx` | Bulk CSV import engine & mappings |
| `/school/settings/documents/print` | `.../settings/documents/print/page.tsx` | Print margins & page geometry settings |
| `/school/settings/documents/templates` | `.../settings/documents/templates/page.tsx` | Standard print templates catalog |
| `/school/settings/examinations` | `.../settings/examinations/page.tsx` | Exam settings hub |
| `/school/settings/examinations/grading` | `.../settings/examinations/grading/page.tsx` | Grading schemes (percentage/GPA) |
| `/school/settings/examinations/rooms` | `.../settings/examinations/rooms/page.tsx` | Exam room halls & seating capacity |
| `/school/settings/examinations/rules` | `.../settings/examinations/rules/page.tsx` | Exam rules & conflict detection policies |
| `/school/settings/examinations/time-slots` | `.../settings/examinations/time-slots/page.tsx` | Exam session time blocks |
| `/school/settings/examinations/types` | `.../settings/examinations/types/page.tsx` | Exam types (Midterm, Final, Unit) |
| `/school/settings/fees` | `.../settings/fees/page.tsx` | Fee management global settings |
| `/school/settings/homework` | `.../settings/homework/page.tsx` | Homework deadlines & submission rules |
| `/school/settings/houses` | `.../settings/houses/page.tsx` | Student house divisions |
| `/school/settings/id-system` | `.../settings/id-system/page.tsx` | Student/Staff ID auto-generation format |
| `/school/settings/invitations` | `.../settings/invitations/page.tsx` | Staff onboarding invitations lifecycle |
| `/school/settings/notices` | `.../settings/notices/page.tsx` | Notice board permissions & categories |
| `/school/settings/notifications` | `.../settings/notifications/page.tsx` | Email & push notification channels |
| `/school/settings/permissions` | `.../settings/permissions/page.tsx` | RBAC permission matrix |
| `/school/settings/results` | `.../settings/results/page.tsx` | Grade calculations & report card rules |
| `/school/settings/roles` | `.../settings/roles/page.tsx` | Institutional role definitions |
| `/school/settings/roles/[id]` | `.../settings/roles/[id]/page.tsx` | Custom role editor |
| `/school/settings/roll-numbers` | `.../settings/roll-numbers/page.tsx` | Roll number formatting & rules |
| `/school/settings/school-profile` | `.../settings/school-profile/page.tsx` | School legal profile, affiliation, contact |
| `/school/settings/sections` | `.../settings/sections/page.tsx` | Section management |
| `/school/settings/security` | `.../settings/security/page.tsx` | Security hub (redirects to `/mfa`) |
| `/school/settings/security/authentication` | `.../settings/security/authentication/page.tsx` | Session timeout & lockout policies |
| `/school/settings/security/mfa` | `.../settings/security/mfa/page.tsx` | Multi-Factor Authentication TOTP settings |
| `/school/settings/security/password-policy` | `.../settings/security/password-policy/page.tsx` | Password complexity & rotation rules |
| `/school/settings/security/recovery` | `.../settings/security/recovery/page.tsx` | Account recovery configurations |
| `/school/settings/security/sessions` | `.../settings/security/sessions/page.tsx` | Active user sessions audit & revocation |
| `/school/settings/streams` | `.../settings/streams/page.tsx` | High school academic streams (Science/Arts) |
| `/school/settings/subjects` | `.../settings/subjects/page.tsx` | Subject catalog settings |
| `/school/settings/timetable` | `.../settings/timetable/page.tsx` | Period duration, breaks & days config |
| `/school/settings/users` | `.../settings/users/page.tsx` | Institutional user directory |
| `/school/settings/users/[id]` | `.../settings/users/[id]/page.tsx` | Individual user account details |

---

## 4. Teacher Portal `(teacher)`

All routes wrapped in `apps/web/src/app/(teacher)/teacher/layout.tsx`:

| Route | Page File | Description |
| :--- | :--- | :--- |
| `/teacher/dashboard` | `apps/web/src/app/(teacher)/teacher/dashboard/page.tsx` | Teacher dashboard: today's schedule & classes |
| `/teacher/attendance` | `apps/web/src/app/(teacher)/teacher/attendance/page.tsx` | Daily roll-call attendance register for assigned classes |
| `/teacher/classes` | `apps/web/src/app/(teacher)/teacher/classes/page.tsx` | Assigned classes & divisions list |
| `/teacher/students` | `apps/web/src/app/(teacher)/teacher/students/page.tsx` | Student roster in teacher's assigned divisions |
| `/teacher/timetable` | `apps/web/src/app/(teacher)/teacher/timetable/page.tsx` | Teacher's personal weekly routine |
| `/teacher/documents` | `apps/web/src/app/(teacher)/teacher/documents/page.tsx` | Teacher KYC & legal document verification |

---

## 5. Parent Portal `(parent)`

All routes wrapped in `apps/web/src/app/(parent)/parent/layout.tsx`:

| Route | Page File | Description |
| :--- | :--- | :--- |
| `/parent` | `apps/web/src/app/(parent)/parent/page.tsx` | Parent home: child overview & quick actions |
| `/parent/fees` | `apps/web/src/app/(parent)/parent/fees/page.tsx` | Student fee breakdown & receipt PDF download |
| `/parent/notices` | `apps/web/src/app/(parent)/parent/notices/page.tsx` | School notices & circulars |
| `/parent/notifications` | `apps/web/src/app/(parent)/parent/notifications/page.tsx` | Push/system notification stream |
| `/parent/profile` | `apps/web/src/app/(parent)/parent/profile/page.tsx` | Parent identity & contact information |
| `/parent/results` | `apps/web/src/app/(parent)/parent/results/page.tsx` | Child examination report cards & GPA |

---

## 6. Testing & Observability Platform

| Route | Page File | Description |
| :--- | :--- | :--- |
| `/admin/testing` | `apps/web/src/app/admin/testing/page.tsx` | Legacy admin route; redirects to `/testing-center` |
| `/testing-center` | `apps/web/src/app/testing-center/page.tsx` | Dedicated test runner, synthetic load tester & health telemetry |

