# RIVO — Module 10: Teacher Ecosystem (Responsive Web & PWA)

> **Document:** `MODULE_10_TEACHER_ECOSYSTEM_PWA.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Frontend Lead & PWA Specialist | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver a fast, mobile-first Responsive Web Portal and Progressive Web App (PWA) within `apps/web/(teacher)` enabling teachers to conduct morning roll calls, distribute homework, enter examination marks with autosave drafts, and review substitution timetables without requiring a native mobile app install.

---

## 2. Existing Implementation Status
- Teacher web layout and basic pages exist in `apps/web/src/app/(teacher)`.
- Gaps: PWA manifest is unconfigured; offline attendance sync is unbuilt; marks locking workflow is incomplete.

---

## 3. Required Final Functionality
- Installable PWA with offline precaching for static assets and timetable rosters.
- 1-tap morning roll-call interface defaulting to `PRESENT`, tapping to toggle `ABSENT`/`LATE`.
- Offline attendance drafts cached in IndexedDB and synched automatically upon network restoration.
- Examination marks entry matrix with score bounds validation, draft saving, and Principal locking.
- Privacy-preserving parent communication (teachers' personal phone numbers strictly concealed).

---

## 4. Technical Requirements
- Next.js 16 App Router PWA configuration (`manifest.json`, Web App Manifest, Service Worker).
- IndexedDB storage via `idb` for offline draft queues.
- Tailwind CSS v4 responsive mobile-first layouts (360px to 1440px viewports).

---

## 5. Frontend Tasks
- `RIVO-TCH-001`: Configure PWA manifest, service worker registration, and home-screen install prompts in `apps/web/src/app/(teacher)/layout.tsx`.
- `RIVO-TCH-002`: Build 1-tap attendance roll-call interface in `apps/web/src/app/(teacher)/teacher/attendance/page.tsx`.
- `RIVO-TCH-003`: Implement IndexedDB offline draft attendance synchronization queue in `apps/web/src/lib/offline/attendance-queue.ts`.
- `RIVO-TCH-004`: Implement examination marks entry matrix with draft saving and locking in `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx`.

---

## 6. Backend Tasks
- Validate `POST /api/attendance` verifies teacher's class assignment.
- Implement `POST /api/exams/marks/batch` and locking endpoint `/api/exams/papers/[id]/lock`.

---

## 7. Database Tasks
- Verify `TeacherAssignment`, `AttendanceRegister`, `ExamMark`, and `Homework` models in Prisma.
- Ensure teacher queries strictly enforce `where: { schoolId: auth.schoolId }`.

---

## 8. API Requirements
- `GET /api/teacher/classes`: Returns classes and sections assigned to authenticated teacher.
- `GET /api/teacher/timetable`: Returns today's period schedule and substitution duties.
- `POST /api/teacher/attendance`: Submits classroom roll call.

---

## 9. Security Requirements
- Object-level authorization: Teachers cannot view or edit marks/attendance for unassigned classes.
- Zero teacher personal mobile number exposure in outgoing notices.

---

## 10. UI/UX Requirements
- Touch-friendly roll call: 48px minimum touch target size.
- Offline banner indicator: "Offline mode active. Attendance draft saved locally."
- Quick period switcher at top of mobile screen: "Period 1: Mathematics (Class 8A)".

---

## 11. Integration Dependencies
- Consumes Attendance Engine (Module 06) and Academic Scheduling (Module 07).
- Triggers parent absence notifications via Communication Gateway (Module 08).

---

## 12. Error and Edge-Case Handling
- If school Wi-Fi drops mid-roll-call, UI indicates draft saved locally in IndexedDB without throwing error.
- Reconnect automatically flushes queued drafts and displays success toast.

---

## 13. Testing Strategy
- PWA Lighthouse audit: Score > 90 across Performance, Accessibility, and PWA criteria.
- Offline simulation: Disconnect DevTools network, mark attendance, reconnect, verify commit in database.
- Marks locking test: Verify locked marks cannot be edited without Principal unlock.

---

## 14. Acceptance Criteria
- [ ] Teacher installs PWA to smartphone home screen from mobile browser.
- [ ] Classroom attendance marked in < 30 seconds.
- [ ] Draft marks saved locally survive browser close.

---

## 15. Deployment Considerations
- PWA icons (`icon-192.png`, `icon-512.png`) placed in `apps/web/public/`.

---

## 16. Completion Checklist
- [ ] `RIVO-TCH-001` completed.
- [ ] `RIVO-TCH-002` completed.
- [ ] `RIVO-TCH-003` completed.
- [ ] `RIVO-TCH-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- iOS Safari PWA service worker lifecycle requires explicit cache management to prevent stale JavaScript assets.
