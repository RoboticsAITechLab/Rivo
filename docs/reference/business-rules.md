# Core Business Rules Reference

This document compiles the 24 foundational business rules verified against the active codebase of the Rivo Web Application.

---

## 1. Multi-Campus & Institutional Architecture

1. **Single Institution Hierarchy**: All campuses, classes, and academic records belong strictly to one central school entity (`SchoolProfile`).
2. **Campus Filtering vs Aggregation**: Standard daily views (attendance, timetable) filter by selected campus; institutional reporting and roll allocation aggregate across all campuses when set to "All Campuses".
3. **Physical Room Isolation**: Physical rooms belong to a single campus; a class section meeting at Campus A cannot book a room located at Campus B.

---

## 2. Academic Calendar & Structure

4. **Single Current Academic Session**: Exactly one academic session may have `isCurrent = true` at any time. Activating a session automatically sets all others to non-current.
5. **Archived Session Immutability**: Historical records (attendance, examination marks, rosters) linked to an `ARCHIVED` session cannot be modified.
6. **Class-to-Section Cascading**: Every section must belong to a parent class. Selecting a class in dropdowns filters the available section choices.
7. **Optional Academic Streams**: Streams (Science, Commerce, Arts) are only enforced for grade levels where `streamEnabled = true` (typically Classes 11 and 12).
8. **Optional House System**: House allocation is completely optional (`houseId` may be null). No student admission or examination workflow requires house membership.

---

## 3. Entity Reuse & Integrity

9. **Single Teacher Entity Model**: A teacher is created once in the faculty directory and reused across timetable scheduling, homeroom mentorship, and marks entry. Duplicate teacher entities are strictly prohibited.
10. **Canonical Subject Catalog**: Academic subjects are created once centrally. Timetable periods, homework tasks, and exam papers reference the canonical `subjectId`.
11. **Configurable Period Structure**: Timetable periods represent abstract time slots (Period 1, Break, etc.) referencing dynamic settings. Timetable cells bind to `periodId`, never hardcoded minute timestamps.
12. **Safe Deactivation Over Deletion**: Entities with active dependencies (classes with students, subjects with marks, teachers with timetable slots) cannot be hard deleted; they must be deactivated (`status = INACTIVE`).

---

## 4. Student Intake & Documentation

13. **Birth Certificate Optionality**: The Municipal Birth Certificate is always **optional** during student intake and never blocks admission completion.
14. **Transfer Document Rule**: Previous school marksheet and Transfer Certificate (TC) are required **only** if intake type is `TRANSFER` (lateral admission). For `FIRST_TIME` admissions, transfer documents are not applicable.
15. **Duplicate Prevention Guard**: If First Name, Last Name, Date of Birth, and Primary Guardian Phone match an existing active student, the intake wizard surfaces a collision confirmation modal.

---

## 5. Dual Roll Numbering Architecture

16. **Class Roll vs Exam Roll Independence**: Class Roll Number is a classroom-internal identifier; Formal Exam Roll Number is an institution-wide, board-level examination identifier.
17. **Exam Roll Number Stability**: An Exam Roll Number does **not** change when new examination series (Mid-Term, Pre-Board, Annual) are created within an academic session.
18. **Non-Recycling of Exam Rolls**: If an examinee withdraws or transfers from school, their allocated Exam Roll Number is permanently retired and never reassigned to subsequent intakes.
19. **Stream-Aware Ordering**: Senior secondary roll generation sorts examinees by Stream Code prior to alphabetical name sorting.

---

## 6. Examinations, Marks & Results

20. **Schedule Conflict Prevention**: No student may be scheduled for two concurrent papers in the same time slot, and daily paper limits are enforced per exam rules.
21. **Marks Bounds Enforcement**: Raw marks entered by evaluators must satisfy `0 <= marksObtained <= paper.maxMarks`.
22. **Result Publication Lockdown**: Once an examination result is transitioned to `PUBLISHED`, marks entry is locked to prevent retrospective tampering without administrative override.

---

## 7. Security & Authorization

23. **UI Gate vs API Boundary**: All role and permission checks in the web application control the presentation boundary. Server-side authorization must be independently validated on every API mutation.
24. **Unsaved Changes Protection**: Navigating away from dirty institutional forms without saving triggers an unsaved changes confirmation modal.
