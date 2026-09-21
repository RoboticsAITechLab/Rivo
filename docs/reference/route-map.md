# Complete Route Map Reference

This document maps all 61 active routes identified in the Rivo Web Application codebase (`apps/web/src/app`).

---

## 1. Gateway & Authentication Routes

| Route | Purpose | Role Access | Primary Actions |
| :--- | :--- | :--- | :--- |
| `/` | Root entrypoint | Public | Dynamic redirect to `/login` or active session dashboard |
| `/login` | Primary login portal | Public | Credential verification, MFA challenge prompt |
| `/forgot-password` | Account recovery request | Public | Request secure password reset link |
| `/verify-email` | Email confirmation gate | Public | Validates email ownership verification tokens |
| `/invite/accept` | Staff onboarding gateway | Public | Accept invitation token, establish password & profile |
| `/access-denied` | Authorization boundary gate | Authenticated | Informs user of missing permissions for requested URL |
| `/portal` | Role dispatch gateway | Authenticated | Directs user to `/school`, `/teacher`, `/student`, or `/parent` |

---

## 2. Core School Operations Routes

| Route | Purpose | Role Access | Main Actions |
| :--- | :--- | :--- | :--- |
| `/school` | School Executive Dashboard | School Admin | Institutional metrics, KPI cards, quick actions |
| `/school/students` | Student Directory | Admin, Teacher | Student list, search, filter, open Student 360 sheet |
| `/school/students/admission`| Student Intake Workspace | School Admin | 8-step admission wizard, document upload, duplicate check |
| `/school/teachers` | Faculty Directory | School Admin | Faculty roster, subject qualifications, contact info |
| `/school/classes` | Grade & Class Directory | Admin, Teacher | Grade level hierarchy, capacity, class teacher view |
| `/school/classes/new` | Create Class Wizard | School Admin | Create grade, enable academic streams |
| `/school/sections` | Section Cohorts Directory | Admin, Teacher | Section management, campus mapping, capacity |
| `/school/subjects` | Canonical Subject Catalog | School Admin | Define subjects, codes, theory/practical, weekly loads |
| `/school/timetable` | Master Weekly Timetable | Admin, Teacher | Interactive schedule matrix, period slotting, clash alerts |
| `/school/attendance` | Daily Attendance Register | Admin, Teacher | Mark present/absent/late, save register, view history |
| `/school/homework` | Homework Management Hub | Admin, Teacher | Assign homework, attach materials, track due dates |
| `/school/exams` | Formal Examination Hub | Admin, Teacher | Exam series overview, papers, candidate roster |
| `/school/exams/new` | New Examination Wizard | School Admin | Define exam name, type, session, participating grades |
| `/school/exams/[id]/documents` | Exam Document Print Center | Admin, Teacher | Preview & print exam timetables, admit cards, marksheets |
| `/school/results` | Marks Entry & Publication | Admin, Teacher | Enter raw scores, compute grades, moderate, publish |
| `/school/notices` | Institutional Circulars | Admin, Teacher | Draft, schedule, target, and broadcast school notices |
| `/school/notifications` | Alert Center & History | Authenticated | Review in-app alerts, unread notifications, system events |
| `/school/settings` | Institutional Settings Hub | School Admin | Master navigation to all configuration modules |

---

## 3. General Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/school-profile` | Global Institution Identity | Configure name, affiliation code, legal address, contacts |
| `/school/settings/branding` | Institutional Assets | Upload primary logo, school crest seal, signatures |
| `/school/settings/campuses` | Multi-Campus Directory | Register campus branches, branch codes, campus heads |

---

## 4. Academic Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/academic-sessions` | Academic Year Calendar | Define session years, start/end bounds, current session flag |
| `/school/settings/classes` | Academic Grade Hierarchy | Configure grade levels, stream applicability, progression |
| `/school/settings/sections` | Section Division Setup | Configure division names, room links, maximum capacity |
| `/school/settings/subjects` | Subject Catalog Setup | Canonical course codes, subject types, weekly demands |
| `/school/settings/streams` | Academic Streams Setup | Define tracks (Science, Commerce, Arts, etc.) |
| `/school/settings/houses` | Optional House System | Configure house names, codes, colors, house masters |
| `/school/settings/roll-numbers` | Dual Roll Number Policy | Configure class & exam roll formulas, non-recycling rules |

---

## 5. Operations Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/attendance` | Attendance Policies | Configure allowed statuses, cutoff times, lockouts |
| `/school/settings/timetable` | Timetable & Periods Setup | Define working days, period timings, clash detection |
| `/school/settings/homework` | Homework Assignment Rules | Attachment size limits, submission tracking, parent visibility |
| `/school/settings/examinations`| Exam Series Rules & Slots | Define exam types, morning/afternoon slots, conflict rules |
| `/school/settings/results` | Grading & Publication Policy | Configure grading schemes, letter grades, publish lockdown |

---

## 6. People & Access Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/users` | User Accounts Directory | Search users, assign roles, suspend accounts, reset MFA |
| `/school/settings/roles` | Institutional Role Profiles | Create custom roles, inspect system role permissions |
| `/school/settings/permissions` | Permission Matrix Hub | Toggle module action rights (`VIEW`, `CREATE`, etc.) & scopes |
| `/school/settings/invitations` | Staff Onboarding Center | Dispatch user invitations, monitor pending tokens, revoke |

---

## 7. Security Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/security/authentication` | Auth Protocols | Toggle password login, email verification, session timeouts |
| `/school/settings/security/password-policy` | Credential Rules | Set minimum length, character complexity, lockout thresholds |
| `/school/settings/security/sessions` | Active Device Logins | View concurrent logins, terminate suspicious devices |
| `/school/settings/security/mfa` | Two-Factor Auth Settings | Enforce MFA for admins or staff, supported TOTP methods |
| `/school/settings/security/recovery` | Account Recovery Rules | Configure self-service reset rules, token expirations |

---

## 8. Communication, Documents & Data Settings Routes

| Route | Purpose | Primary Actions |
| :--- | :--- | :--- |
| `/school/settings/notices` | Notice Publishing Rules | Teacher draft permissions, default audience settings |
| `/school/settings/notifications` | Notification Gateways | Channel toggles (In-App, Email, SMS) and event subscriptions |
| `/school/settings/documents` | Print Templates & Layouts | Configure paper sizes, margins, watermarks, headers/footers |
| `/school/settings/data` | Data Import & Export Hub | Bulk CSV intake, historical export logs, full data backups |
