# Subject Catalog Administration

The Subject Catalog (`/school/settings/academic/subjects`) maintains the canonical registry of all courses, academic subjects, and lab curriculums taught across the institution.

---

## 1. Single Entity Reuse Model

In Rivo, a subject is defined **once** in the Subject Catalog and reused across every dependent module:

```
                  [Canonical Subject Catalog]
                              │
         ┌────────────┬───────┴────────┬────────────┐
         ▼            ▼                ▼            ▼
    [Timetable]  [Homework]      [Exam Papers]  [Results]
```

This prevents duplicate subject entities from causing split marks, conflicting timetable entries, or disjointed grade reporting.

---

## 2. Subject Entity Attributes

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Subject Name** | String | Official academic course title (e.g., "Mathematics", "Advanced Physics"). |
| **Subject Code** | String | Alphanumeric academic code (e.g., "MATH-101", "PHYS-042"). Must be unique. |
| **Subject Type** | Enum | `THEORY`, `PRACTICAL`, `LAB`, or `CO_CURRICULAR`. |
| **Weekly Periods** | Number | Target teaching period demand per week (utilized by timetable engine). |
| **Applicable Classes**| Array | Grade levels where this course is taught. |
| **Applicable Streams**| Array | (Optional) Stream specialization mapping (e.g., Biology under Science stream). |
| **Status** | Enum | `ACTIVE` or `INACTIVE`. |

---

## 3. Operations & Safety Rules

- **Code Immutability**: Once an examination paper has been scheduled or marks entered under a subject code, modifying the `Subject Code` is locked to preserve external board reporting standards.
- **Deactivation**: Inactivating a subject removes it from dropdown selectors for new timetable periods and homework, while retaining full historical marksheets and transcript records.
