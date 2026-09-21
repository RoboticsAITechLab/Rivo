# Faculty & Staff Management (`/school/teachers`)

## 1. Overview

The **Faculty & Staff Module** (`/school/teachers`) manages teaching personnel, departmental assignments, class teacher designations, and teaching workloads.

---

## 2. Central Entity Reuse Principle

> [!IMPORTANT]
> **Single Teacher Entity Model**: When a teacher is created once in Rivo, that record becomes universally available across all operational modules:
> - Assigning Class Teachers in `/school/classes`
> - Assigning Timetable periods in `/school/timetable`
> - Distributing homework in `/school/homework`
> - Entering exam marks in `/school/results`
> - Invigilation duty in `/school/exams`

No module creates duplicate, isolated teacher records.

---

## 3. Teacher Directory & Views

The Teacher Directory supports dual visual layouts:
1. **Table View**: Density-optimized tabular grid displaying Employee ID, Full Name, Department, Primary Campus, Assigned Teaching Classes, and Operational Status.
2. **Card Grid View**: Visual cards displaying teacher profile badges, department tags, contact email/phone, and active period workload metrics.

### Filters Available
- Search by Teacher Name, Employee ID, or Email.
- Filter by Department (e.g. `Mathematics`, `Sciences`, `Languages`, `Humanities`).
- Filter by Campus location.
- Filter by Status (`ACTIVE`, `ON_LEAVE`, `INACTIVE`, `TERMINATED`).

---

## 4. Teacher Detail Sheet & Profile

Clicking on any faculty member opens the **Teacher Detail Sheet**:
- **Identity & Contact**: Employee ID, Date of Joining, Designation, Qualification, Email, and Emergency Phone.
- **Teaching Assignments**:
  - Designated Class Teacher of: `Class 10 - Section A`.
  - Teaching Subjects: `Mathematics (Class 9, Class 10)`, `Physics (Class 11)`.
- **Workload Summary**: Total scheduled teaching periods per week (e.g. 24 periods/week).
- **Security & User Account**: Indicates whether the teacher has an active login user account linked to their profile.

---

## 5. Adding & Editing Faculty

Click **Add Faculty** to open the creation sheet:
1. **Personal Details**: First Name, Middle Name, Last Name, Gender, Date of Birth.
2. **Employment Details**: Employee ID (e.g. `EMP-104`), Department, Designation, Joining Date, Employment Type (`FULL_TIME`, `PART_TIME`, `VISITING`).
3. **Campus Binding**: Designate primary campus site.
4. **Subject & Class Assignments**: Multi-select academic subjects and classes the teacher is qualified to teach.
5. **System User Invitation**: Option to simultaneously dispatch a portal invitation to the teacher's email address.
