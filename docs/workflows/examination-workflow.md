# Formal Examination Lifecycle Workflow

This workflow details the comprehensive lifecycle of conducting a formal institutional examination series.

---

## 1. End-to-End Examination Lifecycle

```
[1. Define Exam Series]
          │
          ▼
[2. Define Exam Papers & Maximum Marks]
          │
          ▼
[3. Enroll Eligible Candidate Cohorts]
          │
          ▼
[4. Verify / Allocate Exam Roll Numbers]
          │
          ▼
[5. Construct Exam Schedule & Check Conflicts]
          │
          ▼
[6. Print Timetable & Generate Admit Cards]
          │
          ▼
[7. Conduct Exam & Mark Candidate Attendance]
          │
          ▼
[8. Enter Raw Marks in Evaluation Grid]
          │
          ▼
[9. Review, Moderate & Publish Results]
```

---

## 2. Step-by-Step Instructions

### Step 1: Create Examination Series
1. Open `/school/exams` and click **New Examination**.
2. Select Exam Type (e.g., Mid-Term, Pre-Board, Annual Examination).
3. Select Academic Session, Start Date, and End Date.
4. Select participating Campuses, Classes, and Streams.

### Step 2: Define Papers
1. Under Exam Papers, add papers for each subject:
   - Subject Code and Title
   - Paper Type (Theory / Practical)
   - Maximum Marks (e.g., 80) and Passing Threshold (e.g., 28)

### Step 3: Candidate Verification & Roll Numbers
1. Review enrolled candidates under the Candidates tab.
2. Confirm that each examinee has an assigned **Formal Exam Roll Number** from the Central Roll Registry.

### Step 4: Construct Timetable Schedule
1. Under Exam Schedule, map each paper to:
   - Examination Date
   - Time Slot / Session (e.g., Morning Session 09:00 - 12:00)
   - Assigned Examination Hall / Room
2. The conflict detection engine checks for candidate collisions, room double-booking, and maximum papers per day.

### Step 5: Admit Card & Timetable Generation
1. In the Print Center (`/school/exams/[id]/documents`), preview and print:
   - Master Exam Timetable for notice boards.
   - Individual Student Admit Cards featuring student portrait, exam roll number, schedule, and authorized signature.

### Step 6: Mark Evaluation & Publication
1. After paper completion, open `/school/results?examId=...`.
2. Teachers enter raw scores for their subject.
3. Administrator reviews overall performance and moderation.
4. Click **Publish Results** to finalize transcripts and release report cards.
