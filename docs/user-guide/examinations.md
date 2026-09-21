# Formal Examination System (`/school/exams`)

## 1. Overview & Distinction: Class Test vs Formal Examination

In Rivo, formal examinations are treated with the highest administrative and algorithmic rigor. It is critical to distinguish:

| Characteristic | Class Test / Quiz | Formal Examination Series |
| :--- | :--- | :--- |
| **Authority** | Individual classroom teacher | Central Academic Board / Principal |
| **Duration & Scope** | Single period during regular day | Multi-day or multi-week institution-wide series |
| **Identification** | Daily Class Roll Number | **Central Formal Exam Roll Number** |
| **Hall Tickets** | Not issued | Required; verified with student photograph & seal |
| **Seating Allocation** | Regular classroom desks | Configured Exam Venues (grid rows × columns) |
| **Marksheet Impact** | Informal formative assessment | Cumulative term GPA, formal promotion/retention |

---

## 2. Examination Architecture

An examination series in Rivo comprises a multi-layered entity tree:

```
EXAMINATION SERIES (e.g. "Annual Board Exam 2026")
  ├── 1. Examination Definition (Name, Academic Session, Exam Type, Scope)
  ├── 2. Applicable Campuses (Main Campus, West Campus)
  ├── 3. Cohort Eligibility (Classes 9, 10, 11, 12; Senior Streams)
  ├── 4. Examination Papers (e.g. Physics Theory, Physics Practical, Math Paper 1)
  ├── 5. Master Schedule Entries (Date, Time Slot, Duration, Venue/Room)
  ├── 6. Candidate Registry (Enrolled eligible students)
  ├── 7. Dual Roll Number Allocation (Exam Roll registry generated)
  ├── 8. Hall Ticket & Timetable Documents (PDF generation with school branding)
  ├── 9. Examination Attendance (Present, Absent, Exempted)
  ├── 10. Marks Entry & Moderation (Component marks, grace calculations)
  └── 11. Final Result Publication (Approved & published to transcripts)
```

---

## 3. Examination Routes & Sub-Pages

| Route | Purpose | Key Actions |
| :--- | :--- | :--- |
| `/school/exams` | Examination Control Hub | List active and upcoming exams, create new exam series, view status summaries. |
| `/school/exams/[id]` | Examination Workspace | Manage paper catalog, candidate cohort eligibility, invigilation duties, and paper metrics. |
| `/school/exams/[id]/schedule` | Master Date Sheet & Venue Grid | Map papers to calendar dates, morning/afternoon time slots, and room venues with clash checks. |
| `/school/exams/[id]/documents` | Examination Print Center | Bulk generate and print Hall Tickets, Candidate Desk Slips, and Attendance Sheets. |
| `/school/exams/roll-numbers` | Exam Roll Number Control Hub | School-wide dual roll number allocation engine, candidate validation, and roll stability locks. |

---

## 4. Scheduling & Clash Detection Engine

When building the examination date sheet at `/school/exams/[id]/schedule`:
- Papers reference pre-configured **Exam Time Slots** (e.g. Morning Session: 09:00–12:00) configured in `/school/settings/examinations/time-slots`.
- The engine executes real-time validation via `exam-conflict-detector.ts`:
  - **Cohort Collision**: A student cohort (e.g. Class 10-A) cannot be scheduled for two papers simultaneously.
  - **Venue Capacity Exceeded**: The candidate count for a time slot cannot exceed the assigned room's maximum capacity (`rows × columns`).
  - **Multi-Session Limits**: Warns if a student has more than 2 high-stakes papers on a single calendar day.

---

## 5. Candidate Roll Stability Rule

> [!IMPORTANT]
> **Exam Roll Number Stability Rule**: When a new exam series (e.g. Pre-Board vs Annual Board) is initiated within the same academic session, students retain their **existing assigned Exam Roll Number**. The system does not re-shuffle or re-index roll numbers between exams unless an administrator explicitly triggers an authorized cohort re-allocation.
