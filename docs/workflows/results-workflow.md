# Results Processing & Publication Workflow

This workflow describes marks entry, grade calculation, verification, and final result publication.

---

## 1. Results Lifecycle

```
[Marks Entry by Subject Teachers]
                │
                ▼
[Validation: Marks Between 0 and Maximum Allowed]
                │
                ▼
[Draft Marks Compilation & Automatic Percentage / Grade Calculation]
                │
                ▼
[Administrative Moderation & Review (Grace Marks, Pass/Fail Threshold)]
                │
                ▼
[Formal Publication Trigger (/school/results)]
                │
                ▼
[Results Locked (Read-Only) & Marksheets Accessible in Portals]
```

---

## 2. Step-by-Step Procedure

### Step 1: Subject Marks Entry
1. Open `/school/results`.
2. Select Examination, Class, Section, and Subject Paper.
3. The roster appears with Candidate Name, Exam Roll Number, Maximum Marks, and raw score input fields.
4. Enter marks. The system flags invalid entries (e.g., entering 85 for an 80-mark paper).
5. Save draft entries.

### Step 2: Aggregation & Grading Evaluation
1. Once all subject teachers have submitted scores, view the **Class Consolidated Marks Ledger**.
2. Total Marks, Overall Percentage, and Letter Grade (e.g., A1, B2) compute automatically based on the active Grading Scheme.
3. Pass/Fail standing updates dynamically.

### Step 3: Formal Publication & Lockdown
1. The School Administrator clicks **Publish Results**.
2. Confirmation modal requires explicit verification.
3. Once published:
   - Marks are locked against further direct edits (preventing accidental tampering).
   - Students and parents can view digital grade cards in their respective portals.
   - Formal print-ready Marksheets can be batch downloaded from the Print Center.
