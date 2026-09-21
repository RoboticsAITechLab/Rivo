# Executive Dashboard (`/school`)

## 1. Overview

The **Executive Dashboard** (`/school`) serves as the administrative command center for the school. It summarizes high-level operational health, attendance metrics, pending homework, scheduled examinations, and urgent institutional alerts in real time.

---

## 2. Dashboard Layout & Widgets

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Executive School Dashboard                                   [Quick Actions ▾]│
│ Institutional overview of active academic session: 2026-2027                 │
├───────────────┬───────────────┬───────────────┬───────────────┬──────────────┤
│ TOTAL STUDENTS│ ACTIVE FACULTY│ CLASSES / SEC │ TODAY'S ATTEND│ UPCOMING EXAM│
│     1,420     │       86      │    36 / 72    │     94.2%     │   Pre-Board  │
├───────────────┴───────────────┴───────────────┴───────────────┴──────────────┤
│ ATTENTION ITEMS / PREREQUISITES                                              │
│ ⚠️ 3 Classes without assigned class teacher: Class 9-B, Class 11-A, Class 12-C │
│ ℹ️ Academic Session rollover scheduled in 45 days.                            │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ QUICK ACTION CARDS                            │ RECENT INSTITUTIONAL NOTICES │
│ • [New Student Admission]                     │ • Annual Sports Meet Circular│
│ • [Mark Daily Attendance]                     │ • Pre-Board Date Sheet Issued│
│ • [Create Homework Assignment]                │ • Parent-Teacher Conference  │
│ • [Schedule Examination Paper]                │                              │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 3. Key Metrics & Real Store Data Source

Every KPI tile on the dashboard derives directly from active entities in `SchoolCentralStore`:
1. **Total Students**: `store.students.filter(s => s.status === 'ACTIVE').length`.
2. **Active Faculty**: `store.teachers.filter(t => t.status === 'ACTIVE').length`.
3. **Classes & Sections**: Count of configured grades and active sections.
4. **Today's Attendance Rate**: Calculated from the attendance registers marked for the current calendar date (`(presentCount / totalMarkedCount) * 100`).
5. **Upcoming Formal Examination**: Identifies the next examination with status `SCHEDULED` or `ONGOING`.

---

## 4. Empty State & Unconfigured Behavior

When opening the dashboard in a fresh, unconfigured tenant:
- **No Fake Numbers**: The dashboard does not render placeholder counts or simulated 98% attendance charts.
- **Dependency Warnings**: If no active academic session exists, a high-priority banner appears:
  > **Academic Session Required**: An active session must be created to enroll students, track attendance, and schedule examinations. [Configure Sessions &rarr;](/school/settings/academic-sessions)
- **Campus Warning**: If no campus is registered, an informative notice points to `/school/settings/campuses`.

---

## 5. Quick Actions Menu

Located at the top right of the dashboard:
- **Admit Student**: Opens the multi-step Student Admission Sheet without navigating away.
- **Mark Attendance**: Routes directly to the classroom attendance matrix (`/school/attendance`).
- **Create Homework**: Opens the homework distribution dialog.
- **Schedule Exam**: Navigates to the Examination Control Center (`/school/exams`).
- **System Settings**: Direct shortcut to `/school/settings`.
