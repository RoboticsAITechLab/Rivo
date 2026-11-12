# RIVO — Module 03: School Administration & Institutional Settings

> **Document:** `MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Principal Architect & Product Lead | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver complete administrative cockpits for school leadership (`apps/web/(school)`), including institution profile management, campus configuration, academic session switching, faculty directory governance, teacher KYC verification, and retirement of legacy mock stores.

---

## 2. Existing Implementation Status
- School settings (`/school/settings`), campuses, academic sessions, and staff directories exist in `apps/web/src/app/(school)`.
- Teacher KYC review interface is currently missing (FEAT-03).
- 27 frontend components rely on the 1,532-line monolithic `school-store.ts` (TD-01).

---

## 3. Required Final Functionality
- Institutional settings management (logo, address, timezone, currency, grading systems).
- Academic session management with active session indicators and historical transitions.
- Teacher KYC document verification card in `/school/teachers/[id]` with approve/reject actions.
- Full elimination of `school-store.ts` in favor of live SWR/React Query hooks.

---

## 4. Technical Requirements
- Next.js 16 Server Components with client interactive forms.
- Azure Blob Storage integration for school logos and teacher KYC credential documents.

---

## 5. Frontend Tasks
- `RIVO-ADM-002`: Build Teacher KYC review card in `apps/web/src/app/(school)/school/teachers/[id]/page.tsx`.
- `RIVO-ADM-003`: Decompose `apps/web/src/shared/mock-store/school-store.ts` into domain SWR hooks (`useStudents`, `useClasses`, `useTeachers`).

---

## 6. Backend Tasks
- Implement `PATCH /api/teachers/[id]/kyc` allowing administrators with `teachers.manage` permission to update KYC status and log verification timestamps.
- Validate `apps/web/src/lib/settings/settings-service.ts` caches settings in Redis with automatic invalidation.

---

## 7. Database Tasks
- Verify `SchoolSetting`, `TeacherDocument`, and `Teacher` models in `prisma/schema.prisma`.
- Record verification events in `SecurityAuditLog`.

---

## 8. API Requirements
- `GET /api/schools/[id]`: Returns institutional profile and campus metadata.
- `PATCH /api/schools/[id]`: Updates school branding and operational parameters.
- `PATCH /api/teachers/[id]/kyc`: Approves or rejects teacher verification documents.

---

## 9. Security Requirements
- All routes strictly enforce `where: { schoolId: auth.schoolId }`.
- Teacher KYC documents accessed only via short-lived (5-minute) signed Azure Blob read tokens.

---

## 10. UI/UX Requirements
- Clean tabbed settings interface: General, Campuses, Academic Sessions, Staff Roles, Invitations.
- Teacher KYC badge indicators: `PENDING_REVIEW` (amber), `VERIFIED` (green), `REJECTED` (red).

---

## 11. Integration Dependencies
- Consumes Azure Blob Storage for institutional branding and teacher certificates.
- Powers campus and session context for all academic, fee, and attendance modules.

---

## 12. Error and Edge-Case Handling
- Attempting to delete an active academic session with enrolled students is strictly blocked (`HTTP 409 Conflict`).
- Invalid MIME types or files > 10MB rejected during document upload.

---

## 13. Testing Strategy
- Unit test settings service cache invalidation.
- Integration test teacher KYC verification state machine.
- Verify zero broken imports across all 27 components after `school-store.ts` deletion.

---

## 14. Acceptance Criteria
- [ ] Principal can view teacher degree/KYC certificate and click "Verify Document".
- [ ] Audit log entry records verifying administrator ID and timestamp.
- [ ] `school-store.ts` is deleted; application compiles and runs cleanly.

---

## 15. Deployment Considerations
- Environment variable `AZURE_STORAGE_PUBLIC_CONTAINER="rivo-public"` required for school logos.

---

## 16. Completion Checklist
- [ ] `RIVO-ADM-002` completed.
- [ ] `RIVO-ADM-003` completed.

---

## 17. Known Risks and Unresolved Decisions
- Migrating 27 frontend components away from `school-store.ts` requires careful regression verification on student and class listing pages.
