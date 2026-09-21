# Rivo — Complete Web Application Documentation

Welcome to the official, production-grade technical and operational documentation for the **Rivo School Digital Ecosystem Web Application** (`apps/web`).

Rivo is a unified institutional SaaS platform engineered for multi-campus K-12 schools, senior secondary academies, and educational networks. It centralizes academic architecture, day-to-day school operations, formal examination cycles, dual roll number registries, role-based access control, and institutional branding.

---

## 1. What is Rivo?

Rivo bridges institutional management and daily academic execution. Unlike legacy school portals built from disparate, loosely-coupled modules, Rivo is structured around a **Single Centralized Entity Model**. Central domain records (campuses, academic sessions, classrooms, subjects, faculty, and students) are configured once in the administration layer and dynamically propagate across attendance registers, timetable clash matrices, homework tracking, formal examination schedules, and marksheet tabulation.

### Core Architectural Pillars
- **Zero Synthetic Truth**: The platform avoids hardcoded mock data for operational truth. All dashboards, directories, and metrics operate directly on active configured entities.
- **Dual Roll Number Authority**: Distinct, synchronized class roll numbers (classroom identity) and formal examination roll numbers (aggregated multi-campus cohort examination registry).
- **Multi-Campus Network Support**: Unified governance of multiple physical school sites under a single institutional tenant, supporting site-scoped classes as well as school-wide aggregated reporting.
- **Clash-Free Scheduling**: Algorithmic validation engines prevent teacher double-booking, room capacity overruns, student cohort timetable clashes, and examination slot collisions.
- **Strict Role-Based Perimeter**: Granular module permissions (`READ`, `CREATE`, `EDIT`, `DELETE`) with access scopes (`OWN`, `ASSIGNED`, `SCHOOL`).

---

## 2. Product Scope & User Personas

| Persona | Primary Interface & Responsibilities | Accessible Scope |
| :--- | :--- | :--- |
| **Platform Owner / Super Admin** | Institutional tenant onboarding, subscription status, global database migrations. | Global / Multi-tenant |
| **School Administrator / Principal** | Centralized control center, academic calendar, campus registry, faculty assignments, dual roll number allocation, exam publication, security policies, and user invitations. | `SCHOOL` (Entire Institution) |
| **Teacher / Department Head** | Daily class attendance marking, homework distribution, interactive timetable matrix view, exam marks entry, and student 360 profile audit. | `ASSIGNED` (Assigned cohorts & subjects) |
| **Student (Future Phase)** | View homework tasks, personal attendance percentages, published report cards, hall tickets, and circular notices. | `OWN` (Personal student profile) |
| **Parent / Guardian (Mobile App)** | Mobile-first access (via Flutter app) to circular notices, student attendance alerts, fee receipts, and term report cards. | `OWN` (Linked wards only) |

> [!NOTE]
> **MVP Frontend vs Backend Integration Boundary**: The current Web Application codebase in `apps/web` provides a fully reactive client architecture powered by `SchoolCentralStore` with Prisma schema alignment. Backend authentication sessions, SMS gateway dispatch, and production database persistence connect via dedicated API routes and environment configurations.

---

## 3. Web Application Module Overview

```
RIVO INSTITUTIONAL WEB APP
├── 1. Authentication & Security Gateway (/login, /forgot-password, /verify-email)
├── 2. Executive Dashboard (/school)
├── 3. Student Management & 360 Workspace (/school/students)
├── 4. Faculty & Staff Management (/school/teachers)
├── 5. Academic Architecture (/school/classes, /school/subjects)
├── 6. Operations: Attendance Register (/school/attendance)
├── 7. Operations: Timetable & Bell Schedule (/school/timetable)
├── 8. Operations: Homework Tracking (/school/homework)
├── 9. Formal Examination Control Center (/school/exams)
│   ├── Candidate & Roll Allocation (/school/exams/roll-numbers)
│   ├── Exam Detail & Papers (/school/exams/[id])
│   ├── Schedule & Venue Grid (/school/exams/[id]/schedule)
│   └── Print Center: Admit Cards & Slips (/school/exams/[id]/documents)
├── 10. Results & Tabulation Sheets (/school/results)
├── 11. Institutional Notice Board (/school/notices)
├── 12. Notification Center (/school/notifications)
└── 13. Settings & Control Center (/school/settings)
    ├── General: Profile, Campuses, Branding
    ├── Academic: Sessions, Classes, Sections, Subjects, Streams, Houses, Roll Rules
    ├── Operations: Attendance, Timetable, Homework, Exam Types, Rooms, Grading
    ├── People: Users, Roles, Permissions Matrix, Invitations
    ├── Security: Providers, Password Policy, Active Sessions, MFA, Recovery
    ├── Documents: Templates & Print Layout MM Engine
    └── Data: CSV/XLSX Bulk Import & Export Hub
```

---

## 4. Documentation Sitemap

This documentation suite is organized into operational and technical directories:

### [1. Getting Started](./getting-started/overview.md)
- [System Overview](./getting-started/overview.md) — Core principles and system architecture.
- [Authentication & Access](./getting-started/login.md) — Logging in, password recovery, and email verification.
- [Navigation & Workspace](./getting-started/navigation.md) — TopNav, breadcrumbs, command palette (`⌘K`), and desktop sidebar.
- [First-Time School Setup Guide](./getting-started/first-time-setup.md) — Step-by-step checklist to configure a fresh school from scratch.

### [2. User Guide](./user-guide/dashboard.md)
- [Executive Dashboard](./user-guide/dashboard.md) — Operational metrics, attention items, quick actions, and empty states.
- [Student Management & 360 View](./user-guide/students.md) — Student directory, filters, profile tabs, and bulk actions.
- [Teacher Management](./user-guide/teachers.md) — Faculty profiles, workload allocation, and department codes.
- [Classes & Sections](./user-guide/classes.md) — Multi-campus class-to-section mapping and capacity limits.
- [Subjects & Curriculum](./user-guide/subjects.md) — Theory/Practical catalog and weekly period demands.
- [Daily Attendance](./user-guide/attendance.md) — Register grid, status codes, cutoff windows, and past record lockdown.
- [Homework Management](./user-guide/homework.md) — Assignments, attachment policies, and student tracking.
- [Formal Examination System](./user-guide/examinations.md) — Multi-session exam lifecycle, papers, candidates, and hall allocation.
- [Marksheet & Tabulation Results](./user-guide/results.md) — Marks entry, grading thresholds, moderation, and publication workflows.
- [Interactive Timetable](./user-guide/timetable.md) — Weekly class grid, teacher clash engine, and room allocations.
- [Notice Board](./user-guide/notices.md) — Circular publishing, audience targeting, and scheduling.
- [Notification Center](./user-guide/notifications.md) — Channel routing, alert dispatch, and delivery history.
- [Settings Manual](./user-guide/settings.md) — Complete operational manual for all administrative settings.

### [3. Administration & Governance](./administration/school-profile.md)
- [School Profile](./administration/school-profile.md) — Legal registration, affiliation board, and official contact endpoints.
- [Campus Network](./administration/campuses.md) — Multi-branch locations, site codes, and heads of campus.
- [Academic Sessions](./administration/academic-sessions.md) — Calendar years, term dates, and active session designating.
- [Classes & Section Architecture](./administration/classes-sections.md) — Cohort definitions, progression hierarchy, and room pairings.
- [Subject Catalog](./administration/subjects.md) — Subject taxonomy, codes, and class applicability.
- [Senior Secondary Streams](./administration/streams.md) — Science, Commerce, Arts, and Vocational stream bindings.
- [House System](./administration/houses.md) — Optional student houses, theme colors, and point governance.
- [Dual Roll Number Rules](./administration/roll-numbers.md) — Class roll vs Exam roll algorithms, prefixes, and reserved series.
- [User Accounts](./administration/users.md) — Staff accounts, active/suspended states, and campus assignment.
- [Roles & Scopes](./administration/roles.md) — Custom role definitions and scope bounds (`OWN`, `ASSIGNED`, `SCHOOL`).
- [Permissions Matrix](./administration/permissions.md) — Complete audit table of module-level permissions.
- [Staff Invitations](./administration/invitations.md) — Dispatching email invites, token expiration, and revocation.

### [4. Security & Authentication Center](./security/authentication.md)
- [Authentication Providers](./security/authentication.md) — Password authentication, Google/Microsoft SSO, and IP allowlisting.
- [Authorization & RBAC](./security/authorization.md) — Scope-based boundary enforcement and permission evaluation.
- [Password Policy](./security/password-policy.md) — Complexity criteria, rotation intervals, and failed-login lockouts.
- [Session Management](./security/sessions.md) — Concurrent device limits, inactivity timeouts, and forced remote logout.
- [Multi-Factor Authentication (MFA)](./security/mfa.md) — TOTP Authenticator apps, SMS OTP, and Email verification.
- [Account Recovery](./security/account-recovery.md) — Password reset tokens, self-service links, and administrator overrides.

### [5. End-to-End Workflows](./workflows/student-admission.md)
- [Student Admission Workflow](./workflows/student-admission.md) — Multi-step wizard, document rules, and duplicate detection.
- [Teacher Setup & Allocation](./workflows/teacher-setup.md) — Creating faculty records, assigning teaching cohorts, and role binding.
- [Academic Year Setup Workflow](./workflows/academic-year-setup.md) — Term scheduling, session activation, and rollover procedures.
- [Clash-Free Timetable Setup](./workflows/timetable-setup.md) — Defining bell schedules, period slots, and running conflict validation.
- [Daily Attendance Workflow](./workflows/attendance-workflow.md) — Marking, saving, lockouts, and administrative corrections.
- [Homework Distribution Workflow](./workflows/homework-workflow.md) — Assignment creation, attachment handling, and review.
- [Formal Examination Lifecycle](./workflows/examination-workflow.md) — Creation, paper definitions, scheduling, admit card printing, and marks entry.
- [Dual Roll Allocation Workflow](./workflows/roll-number-workflow.md) — Class sorting rules, candidate generation, and stable exam roll registries.
- [Result Publication & Moderation](./workflows/results-workflow.md) — Marks verification, grace calculation, approval, and portal publishing.
- [Notice Board Publishing](./workflows/notice-workflow.md) — Drafting circulars, scope validation, and audience broadcast.
- [User Access & Invitation Workflow](./workflows/user-access-workflow.md) — Inviting staff, onboarding, role assignment, and access audits.

### [6. Technical Reference & Specifications](./reference/route-map.md)
- [Complete Route Map (61 Pages)](./reference/route-map.md) — Exhaustive catalog of every URL route, layout, and role requirements.
- [Feature Matrix](./reference/feature-matrix.md) — Detailed implementation status (Implemented vs UI Boundary vs Planned).
- [Permission Matrix](./reference/permission-matrix.md) — Module-by-module action matrix across standard system roles.
- [Domain Entity Reference](./reference/entity-reference.md) — Full dictionary of TypeScript & Prisma entities, fields, and relationships.
- [Validation Engine Reference](./reference/validation-reference.md) — Conflict detection algorithms, schemas, and constraint rules.
- [Core Business Rules](./reference/business-rules.md) — 24 non-negotiable institutional logic rules governing Rivo.
- [Standard Terminology & Glossary](./reference/terminology.md) — Canonical definitions of Rivo concepts and nomenclature.
- [Error & Warning Reference](./reference/error-reference.md) — Validation codes, dependency alerts, and empty state triggers.

### [7. Developer & Architecture Guide](./developer/architecture.md)
- [Frontend Architecture](./developer/architecture.md) — Next.js 14 App Router, React 18, Tailwind, and component layers.
- [Project Directory Structure](./developer/project-structure.md) — Organization of `apps/web/src` (`app`, `features`, `components`, `shared`).
- [Frontend Design Patterns](./developer/frontend-patterns.md) — Custom hooks, controlled forms, dialogs, drawers, and sheets.
- [State Management & Central Store](./developer/state-management.md) — Single entity store (`SchoolCentralStore`), pub/sub, and reactive hooks.
- [Data Layer & Prisma Schema](./developer/data-layer.md) — Database schema, migration patterns, and model relationships.
- [Routing & Navigation Architecture](./developer/routing.md) — Route groups, layouts, breadcrumb derivation, and search indexing.
- [Form Systems & Unsaved Changes Guard](./developer/forms.md) — `useUnsavedChanges`, validation schemas, and dirty tracking.
- [Universal Selector System](./developer/selectors.md) — Contextual dropdowns, search-and-select, and modal creation hooks.
- [Testing & Quality Assurance](./developer/testing.md) — TypeScript validation (`tsc`), linting (`eslint`), and automated QA.
- [Developer Contributing Guide](./developer/contributing.md) — Coding conventions, zero mock-data mandate, and pull request workflow.

### [8. Troubleshooting & Diagnostics](./troubleshooting/common-issues.md)
- [Common Operational Issues](./troubleshooting/common-issues.md) — Blank states, missing dropdown records, and resolution steps.
- [Authentication & Login Issues](./troubleshooting/authentication.md) — Session expirations, token invalidity, and lockout recovery.
- [Permission & Access Troubleshooting](./troubleshooting/permissions.md) — Scope misconfigurations, missing action flags, and access denied errors.
- [Form & Validation Troubleshooting](./troubleshooting/forms.md) — Unsaved changes dialog loops, schema validation rejections, and conflict alerts.
- [Development Setup & Build Issues](./troubleshooting/development.md) — Node/pnpm errors, TypeScript compile bugs, and workspace dev scripts.

### [9. Documentation Changelog](./changelog/documentation-status.md)
- [Documentation Status & Audit Report](./changelog/documentation-status.md) — 100% verification coverage metrics, route audits, and gap analyses.

---

## 5. Development Quick Commands

Run these commands from the repository root (`D:\Rivo`):

```bash
# Install dependencies across all workspaces
npm install

# Start development server for web app (runs on http://localhost:3000)
npm run dev --workspace=web

# Run TypeScript compilation audit (zero errors required)
npx tsc --noEmit --project apps/web/tsconfig.json

# Run ESLint validation
npm run lint --workspace=web

# Generate Prisma Client
npx prisma generate
```
