# Product Terminology & Glossary

This glossary defines the standard domain terminology used across the Rivo Web Application.

---

## 1. Institutional Terms

- **School / Institution**: The root educational organization represented by `SchoolProfile`.
- **Campus**: A physical branch, campus, or building complex operating under the umbrella institution.
- **Academic Session**: The annual educational calendar period (e.g., 2026-2027) bounding enrollments and examinations.
- **Current Session**: The single active calendar year flagged with `isCurrent = true`.

---

## 2. Academic Hierarchy Terms

- **Class**: A progressive academic standard or grade level (e.g., Grade 9, Class 10).
- **Section**: A classroom cohort within a Class (e.g., Section A, Lotus).
- **Class Teacher**: The faculty member assigned primary mentorship and daily attendance responsibility for a Section.
- **Subject**: A canonical academic course offering defined in the Subject Catalog.
- **Stream**: A senior secondary curriculum specialization track (e.g., Science, Commerce, Arts).
- **House**: An optional co-curricular or pastoral team grouping (e.g., Red House, Eagles).

---

## 3. Roll Numbering Terms

- **Class Roll Number**: The classroom-internal sequence number used for daily attendance roll calls and classroom seating.
- **Formal Exam Roll Number**: The institution-wide, board-level candidate identifier allocated centrally and printed on official examination admit cards and marksheets.
- **Non-Recycling**: The policy ensuring retired roll numbers of withdrawn students are never re-issued.

---

## 4. Examination & Evaluation Terms

- **Class Test**: Routine, informal periodic classroom quiz without centralized roll allocation.
- **Formal Examination**: Institutional, multi-paper examination series (e.g., Mid-Term, Annual) requiring candidate rosters, conflict checking, admit cards, and published marksheets.
- **Exam Paper**: An individual subject assessment component (Theory, Practical, Lab) within an Exam.
- **Exam Schedule**: The calendar slotting of Exam Papers across dates, time slots, and rooms.
- **Grading Scheme**: The percentage-to-letter-grade mapping (e.g., 90-100% = A1).
- **Published Result**: The finalized, locked evaluation record visible to students and guardians.

---

## 5. Security & Access Terms

- **System Role**: Core immutable role profile (`School Admin`, `Teacher`, `Student`, `Parent`).
- **Custom Role**: An institution-defined authorization profile with tailored permission flags.
- **Data Scope**: The boundary restricting record access (`OWN`, `ASSIGNED`, or `SCHOOL`).
- **MFA (Multi-Factor Authentication)**: Two-step login verification utilizing TOTP authenticator apps.
