# Institutional Permission Matrix Reference

This document details the default role permissions configured across Rivo's functional modules.

---

## 1. Action & Scope Taxonomy

- **Actions**: `VIEW` (Read), `CREATE` (Add), `EDIT` (Update), `DELETE` (Remove/Deactivate), `PUBLISH` (Release), `EXPORT` (Download data).
- **Scopes**:
  - `OWN`: Records created by the user.
  - `ASSIGNED`: Records within the user's mapped classes, subjects, or campuses.
  - `SCHOOL`: Global institutional authority.

---

## 2. Default System Roles Matrix

### School Admin (Universal Full Access)
Holds `VIEW`, `CREATE`, `EDIT`, `DELETE`, `PUBLISH`, and `EXPORT` across all modules with `SCHOOL` scope.

---

### Teacher Role Matrix

| Module | VIEW | CREATE | EDIT | DELETE | PUBLISH | EXPORT | Scope |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Students** | Yes | No | No | No | N/A | Yes | `ASSIGNED` (Only enrolled in teacher's classes) |
| **Teachers** | Yes | No | No | No | N/A | No | `SCHOOL` (Public directory) |
| **Classes & Sections** | Yes | No | No | No | N/A | No | `ASSIGNED` |
| **Subjects** | Yes | No | No | No | N/A | No | `SCHOOL` |
| **Timetable** | Yes | No | No | No | N/A | Yes | `ASSIGNED` |
| **Attendance** | Yes | Yes | Yes | No | N/A | Yes | `ASSIGNED` (Class teacher / assigned period) |
| **Homework** | Yes | Yes | Yes | Yes | Yes | Yes | `ASSIGNED` (Teacher's own assignments) |
| **Examinations** | Yes | No | No | No | No | Yes | `ASSIGNED` |
| **Results Entry** | Yes | Yes | Yes | No | No | Yes | `ASSIGNED` (Teacher's qualified subject papers) |
| **Notices** | Yes | Yes | Yes | No | No | No | `OWN` (Drafts require admin approval if configured) |
| **Settings** | No | No | No | No | No | No | None |
| **Security Center** | No | No | No | No | No | No | None |

---

### Student & Parent Roles (Portal Access)

Students and Parents possess read-only portal privileges scoped strictly to their personal or ward's enrollment records:
- **Attendance**: `VIEW` (Own historical percentage and daily logs).
- **Homework**: `VIEW` (Assignments active for their class cohort).
- **Timetable**: `VIEW` (Weekly schedule of their section).
- **Results**: `VIEW` (Published grade cards and marksheets only).
- **Notices**: `VIEW` (Circulars targeted to All, Students, or Parents).

---

## 3. Architecture Enforcement Rule

> [!IMPORTANT]
> **Boundary Notice**: Frontend permission behavior is currently implemented at the UI boundary (`apps/web/src/components/auth/permission-gate.tsx` and route middlewares). Server-side authorization must be enforced independently on every mutating API endpoint.
