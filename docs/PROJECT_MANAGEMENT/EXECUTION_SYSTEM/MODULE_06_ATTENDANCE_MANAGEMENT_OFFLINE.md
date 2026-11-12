# RIVO — Module 06: Attendance Management & Offline Sync

> **Document:** `MODULE_06_ATTENDANCE_MANAGEMENT_OFFLINE.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Backend Lead & PWA Specialist | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver resilient daily student attendance recording for teachers and school admins, supporting 1-tap roll calls, offline classroom draft persistence in IndexedDB, automated parent absence notifications, and immutable audit logs.

---

## 2. Existing Implementation Status
- Attendance registers and records implemented in `apps/web/src/app/api/attendance/route.ts`.
- Daily attendance screen exists in `apps/web/src/app/(school)/attendance/page.tsx`.
- Gaps: Missing offline draft persistence for classroom teachers; missing automatic WhatsApp/SMS alert dispatch when student is marked `ABSENT`.

---

## 3. Required Final Functionality
- Fast 1-tap attendance roll call interface (default all to `PRESENT`, tap once for `ABSENT`, twice for `LATE`).
- Offline draft attendance queue in IndexedDB synchronizing automatically when device regains connectivity.
- Absence alert dispatch to parents via Tier 1 Push and Tier 2 WhatsApp/SMS at 10:00 AM.
- Monthly attendance analytics and heatmap visualization in Admin and Parent portals.

---

## 4. Technical Requirements
- IndexedDB via `idb` or native service worker storage for client offline drafts.
- Background sync via `navigator.serviceWorker.ready` or polling sync queue.
- Prisma transaction: Updating `AttendanceRegister` and creating batch `AttendanceRecord` rows.

---

## 5. Frontend Tasks
- `RIVO-TCH-002`: Build 1-tap roll call interface in `apps/web/src/app/(teacher)/teacher/attendance/page.tsx`.
- `RIVO-TCH-003`: Implement IndexedDB offline draft attendance queue in `apps/web/src/lib/offline/attendance-queue.ts`.

---

## 6. Backend Tasks
- Update `POST /api/attendance` to accept batch attendance records and trigger asynchronous absence notifications.
- Implement `GET /api/attendance/summary` returning monthly percentage and aggregate absence statistics per class.

---

## 7. Database Tasks
- Verify models: `AttendanceRegister`, `AttendanceRecord`, `AttendanceAuditLog`.
- Enforce unique constraint: `@@unique([schoolId, classId, sectionId, date])` on `AttendanceRegister`.

---

## 8. API Requirements
- `GET /api/attendance?classId=...&sectionId=...&date=...`: Returns roster with existing marks if already taken.
- `POST /api/attendance`: Submits complete register and records.
- `PATCH /api/attendance/records/[id]`: Corrects individual record with mandatory teacher reason and writes `AttendanceAuditLog`.

---

## 9. Security Requirements
- Teachers can only submit attendance for classes/sections where they are assigned as class teacher or substitute.
- Admin attendance corrections require reason string and write immutable audit trail.

---

## 10. UI/UX Requirements
- Giant touch targets for mobile roll call: Green badge for `PRESENT`, Red badge for `ABSENT`, Amber for `LATE`.
- Offline banner indicator: "Offline mode active. 1 attendance register queued for sync."

---

## 11. Integration Dependencies
- Consumed by Parent Mobile App (Module 09) and Notification Gateway (Module 08).

---

## 12. Error and Edge-Case Handling
- Submitting attendance for a gazetted holiday or Sunday prompts confirmation dialog.
- Network drop during submission automatically saves draft to IndexedDB without data loss.

---

## 13. Testing Strategy
- Unit test batch attendance creation transaction.
- Offline simulation: Disconnect network, mark attendance, reconnect, verify server receives data.
- Absence alert test: Verify marking `ABSENT` enqueues notification in `NotificationLog`.

---

## 14. Acceptance Criteria
- [ ] Teacher marks 40 students in < 30 seconds.
- [ ] Offline attendance draft survives browser refresh and commits upon reconnect.
- [ ] Absent student parent receives push/SMS notification.

---

## 15. Deployment Considerations
- Service worker scope must be restricted to `/teacher` and `/student` routes to prevent caching administrative portals.

---

## 16. Completion Checklist
- [ ] `RIVO-TCH-002` completed.
- [ ] `RIVO-TCH-003` completed.

---

## 17. Known Risks and Unresolved Decisions
- Conflicting submissions if two teachers attempt to mark attendance for the same section simultaneously (resolved by `AttendanceRegister` unique date constraint).

