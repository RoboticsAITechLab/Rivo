# System Overview

## 1. Introduction & Philosophy

The **Rivo School Digital Ecosystem** is engineered to eliminate the fragmentation common in educational administration. In conventional school management software, academic planning, timetable generation, daily classroom attendance, formal examinations, and fee receipts exist in disjointed silos, leading to duplicate records, mismatched roll numbers, and frequent scheduling clashes.

Rivo replaces this fragmented paradigm with a **Single Source of Operational Truth**:

```
                       ┌───────────────────────────────┐
                       │       SCHOOL ADMINISTRATOR    │
                       │     Settings & Access Control │
                       └───────────────┬───────────────┘
                                       │ Configures Core Entities Once
                                       ▼
                       ┌───────────────────────────────┐
                       │     CENTRAL ENTITY STORE      │
                       │  Campuses, Sessions, Classes, │
                       │    Subjects, Teachers, Houses │
                       └───────────────┬───────────────┘
                                       │ Propagates Dynamically
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ DAILY ACADEMICS│             │  EXAMINATIONS │              │ COMMUNICATIONS│
│ Attendance    │              │  Roll Registry│              │ Circulars     │
│ Timetable     │              │  Hall Venues  │              │ Notifications │
│ Homework      │              │  Results & GPA│              │ Public Portals│
└───────────────┘              └───────────────┘              └───────────────┘
```

---

## 2. Core Architectural Principles

### 1. Zero Synthetic Truth
Rivo enforces an uncompromised policy regarding configuration truth:
- If a school has not configured any campuses, the campus directory displays an honest empty state with clear calls-to-action (`Configure Campuses →`).
- Dashboards do not display fake student enrollment numbers or artificial attendance percentages.
- Academic and operational metrics reflect actual committed database records.

### 2. Central Entity Reuse
When a teacher is created in the Teacher Directory (`/school/teachers`), that single entity is referenced when assigning class teachers, building timetable schedules, assigning subject syllabi, and designating exam invigilators. No module is permitted to spawn a detached local copy of a teacher or subject record.

### 3. Dual Roll Number Architecture
School systems operate with two distinct student identities:
1. **Class Roll Number**: Classroom-specific identity, assigned annually or term-wise (often alphabetically or by gender) for attendance callouts and internal class rosters.
2. **Formal Examination Roll Number**: High-stakes, centralized identity generated for board/formal term examinations across multi-campus cohorts. Once allocated to a student for an examination series, it remains stable throughout the academic cycle.

### 4. Multi-Campus Hierarchy
Rivo supports multi-site educational institutions. A single institutional tenant manages one or more physical campuses (`Campus A`, `Campus B`). Classrooms and students are bound to a campus, while institutional branding, user authentication, and senior examination tabulation can be aggregated across the entire network.

---

## 3. Technology Stack

The Web Application (`apps/web`) is built with modern, battle-tested web technologies:
- **Framework**: Next.js 14 (App Router architecture with React Server Components and interactive Client boundaries).
- **Language**: TypeScript 5 with strict compiler flags (`tsc --noEmit`).
- **Styling**: Tailwind CSS with custom HSL theme tokens and responsive layouts.
- **Component Primitives**: Radix UI / shadcn-compatible accessible primitives (`Dialog`, `Sheet`, `Select`, `Switch`, `Tabs`, `Tooltip`, `Popover`).
- **Icons**: Lucide React.
- **State Management**: Reactive external store (`useSyncExternalStore`) via `SchoolCentralStore` with unified mutation methods.
- **Database & ORM**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`).

---

## 4. System Boundaries & Deployment

- **Production Target**: Multi-tenant institutional cloud deployment.
- **Client Web Application**: Responsive desktop and tablet workspace (`apps/web`), optimized for school administrators, principals, and teachers.
- **Mobile Ecosystem**: Mobile application target (in `apps/mobile` or companion repositories) designed specifically for parents and students to review homework, attendance alerts, and published report cards.
