# RIVO — Module 04: Student Management & Roll Balancing

> **Document:** `MODULE_04_STUDENT_MANAGEMENT_ROLL_BALANCING.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Principal Architect & Backend Lead | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Manage the complete student lifecycle—admission, enrollment in classes and sections, multi-guardian linking, document uploads, alphabetical roll number auto-generation, section-wide roll number rebalancing, and strict object-level authorization preventing IDOR data leaks.

---

## 2. Existing Implementation Status
- Student profile routes, enrollment creation, and documents implemented in `apps/web/src/app/api/students`.
- Roll number service exists in `apps/web/src/lib/students/roll-number-service.ts`.
- Active critical flaw: `/api/students/[id]` checks only `students.view`, leaking financial balances and KYC documents to unassigned faculty (SEC-03).
- Active functional gap: Missing admin review/approval UI for Roll Number Rebalance (FEAT-02).

---

## 3. Required Final Functionality
- Secure student profile viewing with strict object-level authorization (teachers only see students in assigned classes; financial data restricted to accountants/admins).
- Roll Number Rebalancing Admin UI allowing school principals to preview alphabetical rebalance diffs before committing transactions.
- Student enrollment transitions (active, transferred, graduated, withdrawn).

---

## 4. Technical Requirements
- Next.js 16 App Router, Prisma ORM transactions, Azure Blob Storage for avatar and KYC documents.

---

## 5. Frontend Tasks
- `RIVO-ADM-001`: Implement Roll Number Rebalance approval modal in `apps/web/src/app/(school)/school/academics/classes/[id]/roll-numbers/page.tsx`.
- Update student profile page to dynamically hide fees tab if user lacks financial viewing permissions.

---

## 6. Backend Tasks
- `RIVO-SEC-003`: Update `apps/web/src/app/api/students/[id]/route.ts` to verify teacher class/section assignments and filter sensitive financial/KYC data for non-privileged roles.
- Ensure `apps/web/src/lib/students/roll-number-service.ts` runs inside database transactions with conflict checks.

---

## 7. Database Tasks
- Verify `Student`, `StudentEnrollment`, `ParentStudent`, and `StudentDocument` models in `prisma/schema.prisma`.
- Ensure unique constraint `@@unique([schoolId, rollNumber, classId, sectionId])` is respected.

---

## 8. API Requirements
- `GET /api/students/[id]`: Scoped profile return.
- `PATCH /api/students/[id]`: Profile update with auto or manual roll number assignment.
- `POST /api/students/rebalance-roll-numbers`: Preview or execute alphabetical rebalancing for a section.

---

## 9. Security Requirements
- Strict IDOR prevention: Teachers can only view students enrolled in their assigned classes/sections.
- Financial obligations and payment histories stripped from payload unless user holds `fees.view` or `fees.manage`.

---

## 10. UI/UX Requirements
- Roll number rebalance modal shows side-by-side comparison:
  ```text
  Student Name          Old Roll    New Roll    Status
  Arun Sharma           05          01          Changed
  Bhavna Patel          01          02          Changed
  ```
- Clear warning banner: "Rebalancing will reassign roll numbers alphabetically based on first and last name."

---

## 11. Integration Dependencies
- Feeds student rosters into Attendance (Module 06), Fees (Module 05), Timetable (Module 07), and Parent App (Module 09).

---

## 12. Error and Edge-Case Handling
- Duplicate roll numbers in manual mode rejected with `HTTP 409 Conflict`.
- Deleting a student with historical attendance or fee records soft-deletes via `status = 'TRANSFERRED'`.

---

## 13. Testing Strategy
- Unit test alphabetical roll number calculation algorithm.
- Integration test IDOR authorization: Teacher A requesting Student B returns `HTTP 403`.
- Concurrency test: Two simultaneous student admissions in same section generate distinct roll numbers.

---

## 14. Acceptance Criteria
- [ ] Unassigned faculty cannot view student profiles or fee balances.
- [ ] Principal can preview and commit roll number rebalance without unique constraint violations.
- [ ] Student admission auto-generates sequential admission number.

---

## 15. Deployment Considerations
- Verify `IdFormatConfig` has valid default prefixes (`STU-`, `ADM-`) per school.

---

## 16. Completion Checklist
- [ ] `RIVO-SEC-003` completed.
- [ ] `RIVO-ADM-001` completed.

---

## 17. Known Risks and Unresolved Decisions
- Middle names and non-ASCII characters in student names must sort deterministically using Unicode collation (`localeCompare('en-IN')`).
