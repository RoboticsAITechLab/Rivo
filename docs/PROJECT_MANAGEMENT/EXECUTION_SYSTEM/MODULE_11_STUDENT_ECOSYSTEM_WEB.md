# RIVO — Module 11: Student Ecosystem (Web Portal & Shared Mode)

> **Document:** `MODULE_11_STUDENT_ECOSYSTEM_WEB.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Product Lead & UX Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver an age-appropriate, privacy-preserving academic experience for students across two distinct tiers: (1) Primary Students (K–8) via supervised "Student Mode" in the Parent Mobile App, and (2) Secondary Students (9–12) via a responsive Web Portal at `apps/web/src/app/student`, with persistent homework submission in PostgreSQL.

---

## 2. Existing Implementation Status
- No student route group exists in `apps/web/src/app`.
- `POST /api/homework/submit` currently returns a mock JSON response without writing to the database (DISC-01).
- No database model exists for student homework submissions or attachments in `prisma/schema.prisma`.

---

## 3. Required Final Functionality
- Prisma models `HomeworkSubmission` and `HomeworkAttachment` deployed to PostgreSQL.
- Persistent homework turn-in API accepting student text and Azure Blob file keys.
- Secondary Student Web Portal (`/student`) displaying daily timetable, homework assignments, datesheets, and published results.
- Zero financial access: Student tokens strictly blocked from viewing fee obligations, balances, or parent settings.
- K-8 "Student Mode" visual toggle in Parent Mobile App.

---

## 4. Technical Requirements
- Next.js 16 App Router responsive web portal (`apps/web/src/app/student`).
- Prisma ORM migration adding submission models with foreign keys to `Homework` and `Student`.
- Direct-to-cloud Azure Blob SAS upload for student homework worksheets.

---

## 5. Frontend Tasks
- `RIVO-STU-003`: Build Secondary Student Web Portal at `apps/web/src/app/student/page.tsx` and `homework/page.tsx`.
- `RIVO-STU-004`: Implement K-8 "Student Mode" visual toggle in `apps/parent/lib/views/student_mode_view.dart`.

---

## 6. Backend Tasks
- `RIVO-STU-002`: Replace mock response in `apps/web/src/app/api/homework/submit/route.ts` with real database persistence to `HomeworkSubmission` and `HomeworkAttachment`.

---

## 7. Database Tasks
- `RIVO-STU-001`: Deploy Prisma models:
  ```prisma
  model HomeworkSubmission {
    id           String   @id @default(uuid())
    homeworkId   String
    studentId    String
    schoolId     String
    text         String?
    isLate       Boolean  @default(false)
    submittedAt  DateTime @default(now())
    homework     Homework @relation(fields: [homeworkId], references: [id], onDelete: Cascade)
    student      Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
    attachments  HomeworkAttachment[]
    @@unique([homeworkId, studentId])
    @@index([schoolId, studentId])
  }

  model HomeworkAttachment {
    id           String   @id @default(uuid())
    submissionId String
    fileKey      String
    fileName     String
    fileSize     Int
    mimeType     String
    submission   HomeworkSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  }
  ```

---

## 8. API Requirements
- `GET /api/student/academics`: Returns student's personal timetable, subjects, and teachers.
- `POST /api/homework/submit`: Submits homework text and attachment metadata; checks deadlines and institution submission policies.

---

## 9. Security Requirements
- Role check: Endpoint strictly verifies `auth.role === 'STUDENT'`.
- Access control: Students cannot query other students' homework submissions or academic records.
- Fee firewall: Student token querying `/api/fees/*` receives `HTTP 403 Forbidden`.

---

## 10. UI/UX Requirements
- Clean, engaging homework checklist with countdown badges: `Due in 3 hours`, `Due Tomorrow`, `Submitted`.
- Submission sheet supporting drag-and-drop PDF/image upload with upload progress bar.

---

## 11. Integration Dependencies
- Consumes Homework Management (Module 07) and Azure Blob Storage.
- Feeds submission counts into Teacher Homework Review (Module 10).

---

## 12. Error and Edge-Case Handling
- Submitting after deadline rejected if school setting `allowLateSubmissions: false` (`HTTP 400 LATE_SUBMISSIONS_DISABLED`).
- File size > 10MB rejected with user-friendly error toast.

---

## 13. Testing Strategy
- Unit test homework submission persistence in PostgreSQL.
- Security test: Verify student session querying `/api/fees/payments` receives HTTP 403.
- Late submission test: Verify `isLate: true` flag set when submitted after `dueDate`.

---

## 14. Acceptance Criteria
- [ ] Student submits homework; record persists in `HomeworkSubmission` table.
- [ ] Student portal renders cleanly on mobile and desktop viewports.
- [ ] Student cannot access any fee or financial balance endpoint.

---

## 15. Deployment Considerations
- Zero new runtime services; runs within existing Next.js monolith.

---

## 16. Completion Checklist
- [ ] `RIVO-STU-001` completed.
- [ ] `RIVO-STU-002` completed.
- [ ] `RIVO-STU-003` completed.
- [ ] `RIVO-STU-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Anti-plagiarism or AI content scanning on student homework is deferred to Post-Launch Phase 5.
