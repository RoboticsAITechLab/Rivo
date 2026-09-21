# Marksheet & Tabulation Results (`/school/results`)

## 1. Overview

The **Results & Tabulation Module** (`/school/results`) manages paper marks entry by faculty, component weighting, grade point calculations, moderation, and the formal publication of term marksheets.

---

## 2. Marks Entry Grid

Faculty navigate to `/school/results` to enter student scores:
1. **Context Selectors**: Select the target **Examination**, **Class**, **Section**, and **Subject Paper**.
2. **Tabular Marks Entry**:
   - Lists candidates with their **Exam Roll Number** and **Student Name**.
   - Input fields enforce boundaries defined by the paper (e.g. `0` to `100` max marks).
   - Component splits (e.g. Theory: 70, Practical: 30) where configured.
   - Status toggling: `PRESENT`, `ABSENT`, `MEDICAL`.
3. **Draft vs Saved State**:
   - Teachers save progress as `DRAFT`.
   - Once all scores are verified, the teacher submits scores to `SAVED` status for administrative review.

---

## 3. Grading Schemes & Calculations

The system calculates subject grades and overall results dynamically based on active **Grading Schemes** (`/school/settings/examinations/grading`):
- **Percentage Formula**: `(totalMarksObtained / totalMaxMarks) * 100`.
- **Grade Point & Letter**: Evaluated against configured bands (e.g. `90%–100% -> A+ / 10.0 GP`, `80%–89% -> A / 9.0 GP`).
- **Pass / Fail Determination**: Compares student percentage against the configured minimum pass threshold (default: `33%` or `40%`).
- **Compartment Rule**: Students failing in 1 or 2 subjects receive a `COMPARTMENT` status flag allowing them to register for re-tests.

---

## 4. Result Lifecycle & Publication Lockout

```
[ DRAFT ] ────────► [ IN_REVIEW ] ────────► [ APPROVED ] ────────► [ PUBLISHED ]
Teacher enters      Admin verifies marks   Principal approves      Visible on report
component scores    & grace adjustments    tabulation sheet        cards & portals
```

### Publication Security Rule
- While an exam result is in `DRAFT` or `IN_REVIEW`, it is strictly quarantined to administrative and teaching staff.
- Once results transition to `PUBLISHED`:
  - Student report cards become viewable and printable.
  - Mark entries are **locked against editing**. Any subsequent change requires an administrator to formally retract the result with an audit explanation.
