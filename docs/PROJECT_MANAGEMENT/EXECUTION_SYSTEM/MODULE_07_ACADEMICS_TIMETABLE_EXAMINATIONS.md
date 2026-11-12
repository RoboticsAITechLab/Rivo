# RIVO — Module 07: Academics, Timetable & Examinations

> **Document:** `MODULE_07_ACADEMICS_TIMETABLE_EXAMINATIONS.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Academic Lead & Backend Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Manage institutional academic schedules, period structures, timetable conflict detection, examination terms, datesheet generation, teacher marks entry, draft autosave, marks locking, and published result distribution.

---

## 2. Existing Implementation Status
- Timetable conflict engine implemented in `apps/web/src/app/api/timetable`.
- Examination schedules and paper management in `apps/web/src/app/api/timetable/exam`.
- Marks entry routes exist in `apps/web/src/app/api/exams`.
- Gap: Teacher marks entry matrix lacks draft autosave and principal locking controls (FEAT-05).

---

## 3. Required Final Functionality
- Conflict-free timetable builder detecting teacher overlaps, classroom overlaps, and period collisions.
- Examination datesheet publisher generating print-ready schedule cards.
- Teacher marks entry matrix (`apps/web/(teacher)`) with inline score bounds validation (`score <= maxMarks`).
- Two-stage result workflow: `DRAFT` (teacher edits) -> `LOCKED` (submitted to Principal) -> `PUBLISHED` (visible to parents/students).

---

## 4. Technical Requirements
- Conflict detection algorithms in TypeScript with matrix overlap queries.
- Prisma models: `TimetableSlot`, `TimetableConfig`, `ExamTerm`, `ExamPaper`, `ExamSchedule`, `ExamMark`, `ExamResult`.

---

## 5. Frontend Tasks
- `RIVO-TCH-004`: Build marks entry matrix in `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx` with draft saving and locking buttons.
- Verify timetable grid in School Admin (`/school/timetable`) provides visual drag-and-drop or conflict alerts.

---

## 6. Backend Tasks
- Implement `POST /api/exams/marks/batch`: Accepts array of student marks, validates scores against `maxMarks`, and updates `ExamMark` records.
- Implement `POST /api/exams/papers/[id]/lock`: Transitions marks status to `LOCKED`.
- Implement `POST /api/exams/terms/[id]/publish`: Transitions results to `PUBLISHED` and dispatches notification broadcast.

---

## 7. Database Tasks
- Enforce unique constraint: `@@unique([examScheduleId, studentId])` on `ExamMark`.
- Write result modification events to `ResultAuditLog`.

---

## 8. API Requirements
- `GET /api/timetable/teacher/[id]`: Returns daily and weekly period schedule for a specific teacher.
- `GET /api/exams/schedule?classId=...`: Returns active examination datesheet.
- `POST /api/exams/marks/batch`: Submits marks in draft or locked status.

---

## 9. Security Requirements
- Teachers can only enter marks for subjects and classes they are formally assigned to.
- Once results are marked `LOCKED` or `PUBLISHED`, marks cannot be modified without formal Principal unlock override.

---

## 10. UI/UX Requirements
- Keyboard-optimized marks entry: Pressing `Enter` or `Down Arrow` moves focus to the next student's score input.
- Real-time percentage and grade calculation displayed in table footer.

---

## 11. Integration Dependencies
- Powers Parent Mobile App Results view (Module 09) and Student Web Portal (Module 11).

---

## 12. Error and Edge-Case Handling
- Score greater than maximum marks immediately flagged with red border: "Score exceeds maximum marks of 100".
- Unpublished exam marks return HTTP 403 if requested by parent or student tokens.

---

## 13. Testing Strategy
- Unit test timetable conflict detection algorithm (simultaneous teacher assignment in two classes).
- Marks validation test: Entering score of 105 on a 100-mark paper rejected with `HTTP 400`.
- Locking test: Modifying a `LOCKED` paper without principal role rejected with `HTTP 403`.

---

## 14. Acceptance Criteria
- [ ] Teacher enters marks for 40 students with automatic draft autosave every 30 seconds.
- [ ] Submitting marks with locking prevents subsequent teacher modification.
- [ ] Published results become visible in Parent Mobile App within 1 second of publication.

---

## 15. Deployment Considerations
- Zero external dependencies; runs entirely within PostgreSQL and Next.js serverless functions.

---

## 16. Completion Checklist
- [ ] `RIVO-TCH-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Complex CBSE/ICSE cumulative grading schemes with co-scholastic activities are deferred to Post-Launch Phase 5.

