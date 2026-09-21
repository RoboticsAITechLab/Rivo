# Feature Availability Matrix

This matrix outlines feature implementation status across roles based on current codebase capabilities.

---

## 1. Matrix Status Legend

- **Implemented**: Fully functional with interactive UI, validation, and store persistence.
- **Partial**: Functional workflow present; certain sub-actions (e.g. backend delivery) pending.
- **Frontend Only**: UI controls and state management exist; relies on mock-store or local state pending API integration.
- **Planned**: Scaffolding or architectural slot present, but workflow is deferred.

---

## 2. Core Feature Matrix

| Feature | Primary Route | School Admin | Teacher | Student | Parent | Status | Implementation Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Authentication & Login** | `/login` | Yes | Yes | Yes | Yes | Implemented | Session persistence, route redirection |
| **School Executive Dashboard** | `/school` | Yes | No | No | No | Implemented | Reactive KPI cards, quick actions |
| **Student Directory & Search** | `/school/students` | Yes | Yes | No | No | Implemented | Search, filters, status pills |
| **Student 360 Profile** | `/school/students` | Yes | Yes | No | No | Implemented | 8-tab sheet with deep records |
| **Student Intake Wizard** | `/school/students/admission`| Yes | No | No | No | Implemented | 8-step wizard, document rules, duplicate detector |
| **Faculty Management** | `/school/teachers` | Yes | View | No | No | Implemented | Centralized teacher entity |
| **Class & Section Setup** | `/school/classes` | Yes | View | No | No | Implemented | Cascading hierarchy & capacity |
| **Subject Catalog** | `/school/subjects` | Yes | View | No | No | Implemented | Single-entity reuse model |
| **Interactive Timetable** | `/school/timetable` | Yes | Yes | View | View | Implemented | Real-time clash detection engine |
| **Daily Attendance Register** | `/school/attendance` | Yes | Yes | View | View | Implemented | Cutoff lockout, exception toggles |
| **Homework Management** | `/school/homework` | Yes | Yes | View | View | Implemented | Assign & track; digital submit is planned |
| **Formal Examination Hub** | `/school/exams` | Yes | Yes | View | View | Implemented | Papers, candidate roster, schedule |
| **Exam Document Center** | `/school/exams/[id]/documents`| Yes | Yes | View | View | Implemented | Timetable & admit card printing |
| **Dual Roll Number Allocation** | `/school/settings/roll-numbers`| Yes | View | View | View | Implemented | Non-recycling stability engine |
| **Marks Entry & Results** | `/school/results` | Yes | Yes | View | View | Implemented | Grading schemes, publication lockdown |
| **Institutional Notices** | `/school/notices` | Yes | Draft | View | View | Implemented | Audience scoping, scheduling |
| **Notification Center** | `/school/notifications` | Yes | Yes | Yes | Yes | Partial | UI center implemented; gateway needs API |
| **Settings & Configuration** | `/school/settings/*` | Yes | No | No | No | Implemented | 8 categories, unsaved changes guard |
| **User Directory & Roles** | `/school/settings/people/*` | Yes | No | No | No | Implemented | Custom roles, permission matrix |
| **Security Center** | `/school/settings/security/*` | Yes | No | No | No | Implemented | Password policy, active sessions, MFA |
| **Bulk Data Import / Export** | `/school/settings/data/*` | Yes | No | No | No | Frontend Only| CSV parser present; bulk API pending |
