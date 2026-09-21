# Teacher Provisioning & Assignment Workflow

This workflow guides administrators through onboarding a faculty member and assigning their academic responsibilities without creating duplicate entities.

---

## 1. Workflow Summary

```
[1. Create Teacher Record]
           │
           ▼
[2. Map Qualified Subjects]
           │
           ▼
[3. Assign Class & Section Teaching / Class Teacher Role]
           │
           ▼
[4. Dispatch User Invitation / Account Link]
           │
           ▼
[5. Teacher Selectable in Timetable & Attendance]
```

---

## 2. Step-by-Step Procedure

### Step 1: Create Faculty Record
1. Navigate to `/school/teachers` and click **Add Teacher** (or use the contextual **+ Add New Teacher** modal inside any selector).
2. Enter Full Name, Email, Phone, Campus, and Designation (e.g., "Senior Mathematics Teacher").
3. Save the entity into the canonical `teachers` store.

### Step 2: Subject & Department Qualification
1. Attach subjects from the Subject Catalog that the teacher is certified to instruct.
2. These qualifications filter the teacher list when scheduling subjects on the timetable.

### Step 3: Class & Section Assignments
1. In `/school/settings/academic/classes`, designate the teacher as **Class Teacher** for their homeroom section if applicable.
2. In `/school/timetable`, schedule the teacher into specific weekly period slots.

### Step 4: Provision Portal Login
1. Navigate to `/school/settings/people/invitations`.
2. Dispatch an invitation to the teacher's email with the `Teacher` role.
3. Once accepted, the teacher's authenticated user account links automatically to their faculty profile via email address.

---

## 3. Operational Rule: Single Teacher Entity Reuse

> [!IMPORTANT]
> A faculty member is created exactly once in the Teacher Directory. When creating timetable periods, homework assignments, or examination invigilation rosters, always select the existing teacher from the `UniversalSelector`. Never create duplicate teacher records.
