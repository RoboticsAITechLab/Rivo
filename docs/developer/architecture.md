# Frontend Architecture

This document details the architectural foundation, technologies, and component layers powering the Rivo Web Application (`apps/web`).

---

## 1. Technology Stack

- **Framework**: Next.js 14 / App Router architecture.
- **Language**: TypeScript with strict typing (`npx tsc --noEmit` clean).
- **Styling**: Tailwind CSS with custom institutional design tokens.
- **Component Primitives**: Radix UI headless primitives styled via `shadcn/ui` conventions.
- **State Management**: Zustand centralized school store (`school-store.ts`) with reactive subscriptions and selectors.
- **Form Management**: React Hook Form coupled with Zod validation schemas.
- **Icons**: Lucide React.

---

## 2. Layered Architectural Design

```
+-------------------------------------------------------------------------+
|                              App Router                                  |
|            Layouts, Page Controllers, Boundary Middlewares              |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                           Feature Modules                               |
|   Admission, Attendance, Examinations, Timetable, Results, Settings     |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                          Domain Selectors                               |
|    UniversalSelector, CampusSelect, ClassSelect, TeacherSelect, etc.    |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        Validation & Conflict                            |
|    DuplicateDetector, TimetableConflict, ExamConflict, RollAllocation   |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                       Centralized State Store                           |
|        Single store holding normalized institutional entity graph       |
+-------------------------------------------------------------------------+
```

---

## 3. Core Architectural Tenets

1. **No Duplicate Entity Stores**: Domain entities (`teachers`, `subjects`, `classes`) are held strictly in the central school store. Modules must never instantiate disconnected local entity lists.
2. **Contextual Entity Instantiation**: All universal selectors include an inline `+ Add New` option that launches an instantiation modal and auto-selects the created entity upon save.
3. **Independent Navigation Scrolling**: Complex multi-level interfaces (such as Settings) decouple navigation panel scrolling from the content area, preventing layout jumps.
4. **Form Safety**: Form components bind to `useUnsavedChanges`, warning users before discarding uncommitted edits.
