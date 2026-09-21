# Academic Year Setup & Transition Workflow

This workflow guides administrators through inaugurating a new academic calendar year and promoting eligible student cohorts.

---

## 1. Setup Progression

```
[1. Create Upcoming Session]
           │
           ▼
[2. Finalize & Publish Previous Session Results]
           │
           ▼
[3. Run Student Promotion & Section Progression]
           │
           ▼
[4. Activate New Session (isCurrent = true)]
           │
           ▼
[5. Initialize New Timetable & Attendance Registers]
           │
           ▼
[6. Archive Concluded Academic Session]
```

---

## 2. Step-by-Step Procedure

### Step 1: Session Definition
1. Navigate to `/school/settings/academic/sessions`.
2. Click **Add Academic Session**. Specify Session Name (e.g., "2026-2027"), Start Date, and End Date.
3. Keep status as `UPCOMING` until grading and promotions conclude.

### Step 2: Conclude Current Academic Year
1. Ensure all formal examinations (Final Term / Annuals) have their marks entered and verified.
2. Publish results under `/school/results`.
3. Generate academic transcripts and print report cards from the Document Print Center.

### Step 3: Promote Student Cohorts
1. In the Student Directory (`/school/students`), open the Grade Progression tool.
2. Filter by Grade level (e.g., Class 9 -> Class 10).
3. Review pass/fail standing. Bulk promote successful candidates to the next grade standard.
4. Graduating batches (e.g., Class 12) transition to `GRADUATED` status.

### Step 4: Cutover to New Current Session
1. Return to `/school/settings/academic/sessions`.
2. Toggle the new session as **Current Session** (`isCurrent = true`).
3. Set previous session status to `ARCHIVED`. All previous attendance and grade data becomes read-only.
