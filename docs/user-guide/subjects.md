# Subjects & Curriculum Catalog (`/school/subjects`)

## 1. Overview

The **Subjects & Curriculum Module** (`/school/subjects`) manages the canonical catalog of academic courses, theoretical syllabi, practical lab subjects, and weekly teaching period demands across classes.

---

## 2. Central Entity Propagation

A subject created in the central catalog immediately propagates across the entire operational environment:

```
                  ┌───────────────────────────────┐
                  │       SUBJECT RECORD          │
                  │   Name: Mathematics           │
                  │   Code: MATH-101              │
                  │   Type: THEORY                │
                  └───────────────┬───────────────┘
                                  │ Universal Propagating Link
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ TIMETABLE       │      │ HOMEWORK        │      │ EXAMINATIONS    │
│ Teaching slots  │      │ Assignment tasks│      │ Exam papers &   │
│ & period counts │      │ by subject      │      │ subject results │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 3. Subject Catalog Grid & Search

- **Directory View**: Lists Subject Name, Subject Code, Category/Type (`THEORY`, `PRACTICAL`, `CO_CURRICULAR`, `ELECTIVE`), Applicable Classes, and Active Status.
- **Search & Filter**:
  - Search by Subject Title (e.g. `Physics`) or Code (e.g. `PHY-01`).
  - Filter by Class applicability (e.g. view only subjects taught in `Class 11`).
  - Filter by Subject Type.

---

## 4. Subject Creation & Configuration

Click **Add Subject** (`/school/subjects` or `/school/settings/subjects`):
- **Subject Name**: Canonical name (e.g. `Computer Science`).
- **Subject Code**: Institutional or regulatory code (e.g. `CS-083`).
- **Department**: Assigned academic department (e.g. `Information Technology`).
- **Subject Type**:
  - `THEORY`: Classroom-based teaching.
  - `PRACTICAL`: Laboratory or workshop teaching, requiring lab venue pairing.
  - `ELECTIVE`: Optional student choices (bound to Senior Streams).
- **Weekly Period Demand**: Target number of teaching periods allocated per week (used by the timetable generator).
- **Applicable Classes**: Multi-select checklist indicating which grades study this subject.
