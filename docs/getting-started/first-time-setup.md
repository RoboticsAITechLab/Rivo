# First-Time School Setup Guide

## 1. Setup Overview

When onboarding a new school tenant on Rivo, the database begins completely empty. Because Rivo follows a **Central Entity Architecture**, subsequent features (such as attendance, timetables, and exams) rely on foundational entities.

Follow this systematic 20-step setup checklist in order:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RIVO INITIAL SETUP CHECKLIST                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Institutional Identity       11. Users & Staff Accounts             │
│ 2. Campus Network               12. Roles & Permissions Matrix         │
│ 3. Active Academic Session      13. Bell Schedule Periods & Rooms      │
│ 4. Classes / Grades             14. Timetable Matrix Configuration     │
│ 5. Class Sections               15. Attendance Window Rules            │
│ 6. Subject Catalog              16. Homework Attachment Policy         │
│ 7. Academic Streams (11/12)     17. Exam Types & Time Slots            │
│ 8. Houses (Optional)            18. Grading Schemes & Passing Limits   │
│ 9. Dual Roll Number Rules       19. Document Branding (Seal & Sign)    │
│ 10. Teachers Directory          20. Notification Channels              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Setup Procedure

### Phase 1: Institutional Foundation

#### Step 1: Configure School Profile
- **Route**: `/school/settings/school-profile`
- **Action**: Enter the legal school name, short name, institution code (e.g. `SCH-04281`), affiliation board (e.g. `CBSE`, `ICSE`, `State Board`, `IB`), official contact email, phone, and headquarters street address.
- **Why Required**: Appears on report cards, circulars, fee invoices, and admit cards.

#### Step 2: Register Physical Campuses
- **Route**: `/school/settings/campuses`
- **Action**: Click **Add Campus**. Create at least one campus (e.g. "Main Campus", Code: `MAIN`). For multi-site schools, add all branch sites with their respective campus codes and heads of campus.
- **Why Required**: Cohort assignments, attendance registries, and exam halls are bound to campuses.

#### Step 3: Define Academic Sessions
- **Route**: `/school/settings/academic-sessions`
- **Action**: Click **Create Session**. Provide the session name (e.g. `2026-2027`), calendar start date, and end date. Set its status to `ACTIVE`.
- **Why Required**: Without an active session, student enrollments, timetable schedules, and examinations cannot be initiated.

---

### Phase 2: Academic Architecture

#### Step 4: Define Classes / Grades
- **Route**: `/school/settings/classes` (or `/school/classes`)
- **Action**: Click **Add Class**. Define grade levels (e.g. `Class 1` to `Class 12`), specifying their display sequence and capacity.

#### Step 5: Configure Class Sections
- **Route**: `/school/settings/sections`
- **Action**: For each class, create operational sections (e.g. `Section A`, `Section B`). Assign the physical campus and default room.

#### Step 6: Create the Subject Catalog
- **Route**: `/school/settings/subjects` (or `/school/subjects`)
- **Action**: Click **Add Subject**. Register academic disciplines (e.g. `Mathematics`, `English Literature`, `Physics`). Specify subject codes (e.g. `MATH-101`), type (`THEORY` or `PRACTICAL`), and check applicable classes.

#### Step 7: Configure Senior Secondary Streams (Optional / Grade 11-12)
- **Route**: `/school/settings/streams`
- **Action**: If your school operates Grades 11 and 12, configure streams (e.g. `Science (PCM)`, `Science (PCB)`, `Commerce`, `Humanities`). Bind them to the senior classes.

#### Step 8: Configure Student Houses (Optional)
- **Route**: `/school/settings/houses`
- **Action**: If the school uses a house system, create houses (e.g. `Red House`, `Blue House`), assign theme colors, and specify house masters. *Note: House assignment is strictly optional for students.*

#### Step 9: Establish Roll Number Allocation Rules
- **Route**: `/school/settings/roll-numbers`
- **Action**: Configure your allocation rules:
  - Class Roll sorting: Alphabetical by first name or last name, gender-segregated or unified.
  - Exam Roll format: Aggregated school-wide prefixes, minimum padding digits, and reserved numbers.

---

### Phase 3: Staff & User Onboarding

#### Step 10: Create Faculty & Teachers
- **Route**: `/school/teachers`
- **Action**: Click **Add Faculty**. Register teachers with their employee ID, qualification, contact details, primary campus, and assign them their teaching subjects and classes.

#### Step 11: Register Administrative Users
- **Route**: `/school/settings/users`
- **Action**: Create administrative staff accounts, assign campus scopes, and define operational email logins.

#### Step 12: Audit Roles & Permissions
- **Route**: `/school/settings/roles` and `/school/settings/permissions`
- **Action**: Review role scopes (`OWN`, `ASSIGNED`, `SCHOOL`). Ensure teachers have `ASSIGNED` scope on attendance and marks, while administrators have full `SCHOOL` access.

---

### Phase 4: Operations & Scheduling

#### Step 13: Define Timetable Periods & Examination Rooms
- **Route**: `/school/settings/timetable` and `/school/settings/examinations/rooms`
- **Action**:
  - Configure working days (e.g. Monday to Friday/Saturday).
  - Add bell schedule teaching periods (e.g. Period 1: 08:30–09:15) and break intervals.
  - Register examination venues, classrooms, and auditoriums with grid seating dimensions (rows × columns).

#### Step 14: Build Timetable Matrices
- **Route**: `/school/timetable`
- **Action**: Populate weekly timetable entries. Rivo's conflict engine automatically checks for teacher and room collisions in real time.

#### Step 15: Establish Attendance & Homework Policies
- **Route**: `/school/settings/attendance` and `/school/settings/homework`
- **Action**: Specify the daily attendance cutoff window, past-record lockdown switches, and maximum homework attachment sizes.

---

### Phase 5: Examinations & Formalities

#### Step 16: Configure Examination Types & Slots
- **Route**: `/school/settings/examinations/types` and `/school/settings/examinations/time-slots`
- **Action**: Create formal exam categories (e.g. `Term 1 Exam`, `Half-Yearly`, `Annual Board`) and standard paper time slots (e.g. Morning Session: 09:00–12:00).

#### Step 17: Set Up Grading Schemes
- **Route**: `/school/settings/examinations/grading`
- **Action**: Define percentage bounds, letter grades (e.g. `A+`, `A`, `B`, `F`), grade point averages (GPA), and minimum passing thresholds.

#### Step 18: Upload Document Branding Assets
- **Route**: `/school/settings/branding`
- **Action**: Upload the official school crest/logo, institutional digital seal, and authorized principal signature. Configure millimeter margins in `/school/settings/documents/print`.

#### Step 19: Enable Notification Channels
- **Route**: `/school/settings/notifications`
- **Action**: Toggle desired channels (In-App, Email, SMS) for emergency bulletins, attendance alerts, and exam timetable broadcasts.

#### Step 20: Admit Students or Bulk Import Cohorts
- **Route**: `/school/students`
- **Action**: You are now fully ready to admit students via the **Student Admission Sheet** or perform a bulk CSV enrollment via `/school/settings/data/import`.
