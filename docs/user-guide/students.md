# Student Management & Student 360 (`/school/students`)

## 1. Overview

The **Student Management Module** (`/school/students`) manages the entire student lifecycle—from initial admission and academic enrollment through classroom attendance, exam marksheet generation, and graduation or transfer.

---

## 2. Student Directory & Search Filtering

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Students Directory                                 [Import CSV] [+ Admit New]│
│ Search and filter enrolled student profiles across campuses.                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ 🔎 Search by student name, admission no, or roll number...                ]│
│ Filters: [Campus: All ▾] [Class: All ▾] [Section: All ▾] [Status: Active ▾]  │
├───────┬────────────────────────┬─────────┬─────────┬──────────┬──────────────┤
│ ROLL  │ STUDENT NAME           │ ADM NO  │ CLASS   │ CAMPUS   │ STATUS       │
├───────┼────────────────────────┼─────────┼─────────┼──────────┼──────────────┤
│ 101   │ Sharma, Aarav          │ ADM-842 │ Class 10│ Main     │ [Active]     │
│ 102   │ Patel, Ananya          │ ADM-843 │ Class 10│ Main     │ [Active]     │
│ 103   │ Khan, Zaid             │ ADM-845 │ Class 10│ West     │ [Active]     │
└───────┴────────────────────────┴─────────┴─────────┴──────────┴──────────────┘
```

### Filtering & Search Capabilities
- **Universal Text Search**: Filters in real time across First Name, Last Name, Admission Number, and Class Roll Number.
- **Cascading Filter Selectors**:
  - Selecting a **Campus** filters the student list to that physical location.
  - Selecting a **Class** updates available **Section** options to only those belonging to the selected grade.
- **Status Filter**: View `ACTIVE`, `PROBATION`, `SUSPENDED`, `ALUMNI`, `TRANSFERRED`, or `WITHDRAWN` students.

---

## 3. Student 360 Workspace Sheet

Clicking any student row opens the slide-over **Student 360 Sheet**, organizing the student's complete institutional profile into 8 tabbed views:

```
┌──────────────────────────────────────────────────────────────┐
│ Student 360: Aarav Sharma                         [Edit] [✕] │
│ Class 10 - Section A | Roll No: 101 | Status: ACTIVE         │
├──────────────────────────────────────────────────────────────┤
│ [Profile] [Academic] [Attendance] [Homework]                 │
│ [Exams & Marks] [Family & Guardians] [Documents] [Roll Nos]  │
├──────────────────────────────────────────────────────────────┤
│ 1. Profile Tab: Date of birth, gender, blood group, address. │
│ 2. Academic Tab: Enrollment history, current stream, house.  │
│ 3. Attendance Tab: Real marked percentage, monthly breakdown.│
│ 4. Homework Tab: Active assigned homework tasks & status.    │
│ 5. Exams & Marks Tab: Term report cards and subject grades.  │
│ 6. Family Tab: Primary guardian, emergency contacts.         │
│ 7. Documents Tab: Uploaded birth certificates and TCs.       │
│ 8. Roll Nos Tab: Class roll number vs Formal Exam roll no.   │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Student Status Lifecycle

Rivo enforces strict operational states on student records:
- **`ACTIVE`**: Fully enrolled student. Appears on daily attendance registers, active timetables, and exam candidate lists.
- **`PROBATION`**: Under academic or disciplinary review. Remains on attendance and exam registers with administrative notice.
- **`SUSPENDED`**: Temporarily barred from daily attendance marking; examination hall ticket generation is blocked by rule.
- **`TRANSFERRED`**: Student has left for another school. Transfer Certificate (TC) record generated; removed from active daily registers while historical marks are preserved.
- **`ALUMNI` / `GRADUATED`**: Completed senior graduation. Retained in historical archive for transcript issuance.
- **`WITHDRAWN`**: Admission formally cancelled.

---

## 5. Bulk Student Import via CSV / XLSX

Located at `/school/settings/data/import` or triggered directly via **Import CSV**:
1. Download the pre-formatted CSV template.
2. Template schema includes: `admissionNumber`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `className`, `sectionName`, `campusCode`, `guardianName`, `guardianPhone`.
3. Upload the populated file.
4. Rivo's schema validation engine previews all rows, highlighting duplicate admission numbers, invalid class references, or missing required fields before committing records to the store.
