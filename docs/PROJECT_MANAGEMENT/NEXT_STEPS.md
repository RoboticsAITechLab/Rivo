# Actionable Next Steps & Development Tasks

> **Last Verified:** November 11, 2026  
> **Status:** Prioritized Action Items for Next Development Sprint

---

## 1. Prioritized Development Backlog

### P0 — Immediate Security & Operational Hardening (Sprint 1)
1. **Task 1: Rotate Database Credentials & Clean Templates**
   - **Action:** Rotate the Neon PostgreSQL database password in the Neon cloud console.
   - **Action:** Replace live credentials in `apps/api/.env.example` and `apps/web/.env.example` with sanitized placeholder strings (`postgresql://user:password@host/neondb`).
2. **Task 2: Fix RateLimiter Fail-Closed in Production**
   - **Action:** In `apps/web/src/lib/auth/rate-limiter.ts`, update `consume(key)` so that when `isProductionMode()` is true and Redis is unreachable, it strictly returns `{ allowed: false, remaining: 0, resetAt: ... }` (Fail Closed).
3. **Task 3: Mount Sonner `<Toaster />` in Root Layout**
   - **Action:** In `apps/web/src/app/layout.tsx`, import `Toaster` from `sonner` and mount `<Toaster position="top-right" richColors />` to make all 46+ toast notifications visible.
4. **Task 4: Patch IDOR in Student Detail API**
   - **Action:** In `apps/web/src/app/api/students/[id]/route.ts`, check if `auth.scope === 'ASSIGNED'` (Teacher role) and verify the teacher has an active `TeacherAssignment` covering the student's enrolled class/section before returning profile details.

---

### P1 — High-Priority Architectural & UI Workflow Fixes (Sprint 2)
5. **Task 5: Concurrency Protection for Fee Payment Allocations**
   - **Action:** In `apps/web/src/lib/fees/fee-payment-service.ts`, add a distributed Redis lock (`redlock`) around `recordFeePayment` keyed by `school:${schoolId}:student:${data.studentId}` to prevent race conditions during concurrent payment submissions.
6. **Task 6: Fix Cartesian Product Scoping in Teacher Student Queries**
   - **Action:** In `apps/web/src/app/api/students/route.ts`, replace independent `in` filters for `classId` and `sectionId` with paired `OR` filters:
     `where.enrollments = { some: { OR: teacher.assignments.map(a => ({ classId: a.classId, sectionId: a.sectionId, status: 'ACTIVE' })) } }`.
7. **Task 7: Invalidate Redis Session Cache on School Switch**
   - **Action:** In `apps/web/src/app/api/auth/parent/select-school/route.ts`, call `await invalidateSessionCache(tokenHash, session.userId)` immediately following the database update.
8. **Task 8: Add Teacher Document Verification Tab to Admin UI**
   - **Action:** In `apps/web/src/app/(school)/school/teachers/[id]/page.tsx`, mount a "Documents & Verification" tab displaying uploaded files with "Approve" and "Reject with reason" buttons calling `POST /api/teachers/[id]/documents/[docId]/verify`.
9. **Task 9: Mount Roll Number Rebalance Confirmation Dialog**
   - **Action:** In `apps/web/src/app/(school)/school/students/page.tsx`, mount a "Rebalance Roll Numbers" button that triggers `roll-rebalance-dialog.tsx` with live preview and rebalance execution.

---

### P2 — Quality & Feature Expansion (Sprint 3)
10. **Task 10: Server-Side Report Card PDF Generation Engine**
    - **Action:** Port the vector A4 PDF generation pattern from `apps/web/src/lib/fees/fee-pdf-service.ts` into a new `report-card-pdf-service.ts` using `pdf-lib`.
    - **Action:** Add `GET /api/results/student/[id]/pdf` and bulk class export routes.
11. **Task 11: Remove Suppressed TypeScript Build Checking**
    - **Action:** In `apps/web/next.config.ts`, remove `typescript: { ignoreBuildErrors: true }` and fix any latent type warnings.
12. **Task 12: Add Next.js Route Group Error Boundaries**
    - **Action:** Create `apps/web/src/app/(school)/school/error.tsx`, `apps/web/src/app/(teacher)/teacher/error.tsx`, and `apps/web/src/app/(parent)/parent/error.tsx`.
13. **Task 13: Deprecate Legacy Mock Store (`school-store.ts`)**
    - **Action:** Migrate shared entity selectors in `apps/web/src/shared/entities/` to direct SWR/fetch hooks targeting `/api/classes`, `/api/teachers`, and `/api/subjects`. Delete `school-store.ts`.

