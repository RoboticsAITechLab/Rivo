# Classes & Sections Management (`/school/classes`)

## 1. Overview

The **Classes & Sections Module** (`/school/classes`) defines the cohort hierarchy of the institution. It governs how grade levels (Classes) divide into operational classrooms (Sections) and maps students and faculty to physical spaces.

---

## 2. Hierarchical Relationship

```
Institution (School)
  │
  ├── Class 9 (Grade Level)
  │     ├── Section A (Campus: Main, Room: 101, Capacity: 40, Class Teacher: Ms. Rao)
  │     └── Section B (Campus: Main, Room: 102, Capacity: 40, Class Teacher: Mr. Singh)
  │
  └── Class 10 (Grade Level)
        ├── Section A (Campus: Main, Room: 201, Capacity: 35, Class Teacher: Dr. Verma)
        └── Section B (Campus: West, Room: W-1, Capacity: 35, Class Teacher: Mrs. Das)
```

### Cascading Rule
Throughout Rivo, selectors strictly follow this parent-child hierarchy:
- Selecting **Class 10** filters the available Section dropdown to only sections belonging to Class 10.
- A section cannot exist without a parent Class.
- Deleting a Class requires all child sections and enrolled students to be reassigned or archived first.

---

## 3. Managing Classes

- **Route**: `/school/classes` or `/school/settings/classes`
- **Class Fields**:
  - **Class Name**: Display label (e.g. `Class 1`, `Class 10`, `Kindergarten`).
  - **Display Order**: Integer defining progression sequence (`1` for Class 1, `10` for Class 10).
  - **Graduation Target**: Designates senior terminal grades.

---

## 4. Managing Sections

- **Route**: `/school/settings/sections`
- **Section Fields**:
  - **Section Name**: Operational identifier (`Section A`, `Section B`, `Lotus`, `Rose`).
  - **Parent Class**: The grade level to which this section belongs.
  - **Campus Binding**: The physical campus site where this section convenes.
  - **Default Room**: Physical classroom room number or hall.
  - **Maximum Student Capacity**: Prevents student cohort over-enrollment.
  - **Assigned Class Teacher**: Selects from the central Teacher entity registry.

---

## 5. Class Roll Numbers vs Sections

Class roll numbers are governed at the Section or Class level based on the school's configured **Roll Allocation Policy** (`/school/settings/roll-numbers`):
- Section-scoped: Roll numbers start from `1` in Section A, and restart from `1` in Section B.
- Class-scoped: Roll numbers run continuously across all sections of the grade.
