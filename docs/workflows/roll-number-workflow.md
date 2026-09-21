# Centralized Roll Number Allocation Workflow

This workflow details the institutional roll allocation process, ensuring stability, non-recycling, and multi-campus consistency.

---

## 1. Allocation Architecture Flow

```
[Enrolled Student Roster in Academic Session]
                    │
                    ▼
[Evaluate Multi-Campus Aggregation Rules]
                    │
                    ▼
[Sort by Class -> Section / Stream -> Sorting Formula]
                    │
                    ▼
[Generate Sequential Exam Roll Numbers]
                    │
                    ▼
[Lock Roll Assignments in Central Registry]
                    │
                    ▼
[Stable Across All Exams (Mid-Term, Pre-Board, Annual)]
```

---

## 2. Operational Procedures

### Initial Generation
1. Navigate to `/school/settings/academic/roll-numbers`.
2. Configure Sort Order (Alphabetical by First Name / Last Name).
3. Set Prefix and Zero-Padding rules (e.g., `2026-` followed by 4 digits).
4. Click **Run Allocation Batch**.
5. The system parses all actively enrolled students across classes and generates unique `examRollNumber` identifiers.

### Crucial Stability Rules

1. **New Exam Creation Does NOT Reset Numbers**: When an administrator creates a new exam series (e.g., Annual Exam 6 months after Mid-Term), the candidates retain their existing allocated Exam Roll Numbers.
2. **Student Withdrawal / Transfer**: If Student `EX-1042` withdraws from school, `EX-1042` is retired. It is **never reallocated** to another student to prevent board result collisions.
3. **Mid-Year Admission**: A new student enrolled mid-year receives the next unallocated number at the tail of the sequence (e.g., `EX-1105`).
