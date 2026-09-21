# Classes & Sections Administration

The Classes & Sections module (`/school/settings/academic/classes` and `/school/settings/sections`) governs the institutional academic hierarchy and cohort division.

---

## 1. Hierarchy & Relationship

```
Academic Session
  └── Campus
       └── Class (Grade Level)
            └── Section (Classroom Cohort)
                 └── Student Enrollments
```

- **Class**: Represents a progressive grade standard or academic level (e.g., Grade 1, Grade 9, Grade 12).
- **Section**: Represents an individual classroom division under a grade (e.g., Section A, Section B).
- **Cascading Filter**: When creating assignments or taking attendance, selecting a Class automatically limits the Section dropdown to divisions mapped to that specific Class.

---

## 2. Configuration Attributes

### Class Entity
- **Class Name**: Display label of the grade (e.g., "Grade 10").
- **Grade Level / Numerical Order**: Numeric index (1-12) used to automate chronological student progression.
- **Stream Enabled**: Toggle indicating whether students in this grade must choose an academic stream (typically Grade 11 & 12).
- **Status**: `ACTIVE` or `INACTIVE`.

### Section Entity
- **Section Name**: Division letter or identifier (e.g., "A", "B", "Rose", "Lotus").
- **Class ID**: Parent class reference.
- **Campus ID**: Campus location where the physical section meets.
- **Class Teacher**: Assigned faculty member acting as primary classroom mentor and attendance custodian.
- **Room ID**: Default assigned homeroom facility.
- **Maximum Capacity**: Student enrollment ceiling (enforced during admission).

---

## 3. Administrative Rules

1. **Deletion vs Deactivation**: A class or section cannot be deleted if active students are enrolled in it. Doing so preserves historical audit integrity; administrators must mark the entity `INACTIVE` instead.
2. **Teacher Assignment**: A teacher assigned as Class Teacher retains primary attendance rights for that specific section.
3. **Empty Class State**: When setting up a new institution, the system presents an initial setup button: *"Create your first academic class to begin organizing students."*
