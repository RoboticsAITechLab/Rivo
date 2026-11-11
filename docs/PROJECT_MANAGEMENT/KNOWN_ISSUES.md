# Known Issues & Operational Limitations

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Known Issues Catalog

---

## 1. Catalog of Known Issues

### Issue 1: Sonner Toaster Missing in Root Layout
- **Component:** `apps/web/src/app/layout.tsx`
- **Impact:** Over 46 components trigger `toast.success()` and `toast.error()`, but notifications are completely invisible to users in the browser because `<Toaster />` is not mounted.
- **Workaround / Fix:** Mount `<Toaster position="top-right" richColors />` in `apps/web/src/app/layout.tsx`.

### Issue 2: Offline Integration Tests Fail Without Remote Neon Connection
- **Component:** `apps/web/src/__tests__/*`
- **Impact:** Running `npm test` without network access or when Neon compute is sleeping fails with `PrismaClientInitializationError: Can't reach database server`.
- **Workaround:** Local development requires a local PostgreSQL container running on port 5432 or an active internet connection to Neon.

### Issue 3: Stale Multi-School Session Cache for Parents
- **Component:** `apps/web/src/app/api/auth/parent/select-school/route.ts`
- **Impact:** When a parent with children in two schools switches active school, PostgreSQL updates, but Redis session cache `rivo:session:<tokenHash>` is not invalidated. Subsequent requests use the old school context for up to 5 minutes.
- **Fix:** Add `await invalidateSessionCache(tokenHash, session.userId)`.

### Issue 4: Teacher Document Admin Review Tab Missing in UI
- **Component:** `apps/web/src/app/(school)/school/teachers/[id]/page.tsx`
- **Impact:** Faculty can upload compliance files in `/teacher/documents`, and the API `/api/teachers/[id]/documents/[docId]/verify` is fully functional, but the administrator profile page lacks the review tab to view and approve/reject documents.

### Issue 5: Roll Number Rebalance Trigger Missing in UI
- **Component:** `apps/web/src/app/(school)/school/students/page.tsx`
- **Impact:** The alphabetical roll calculation engine and rebalance APIs (`POST /api/students/rolls/rebalance`) are fully implemented and tested, but no button exists in the students UI to launch the dialog.

### Issue 6: Student Homework Turn-in Lacks Database Persistence
- **Component:** `apps/web/src/app/api/homework/submit/route.ts`
- **Impact:** Endpoint validates file size and deadlines, but returns mock simulated JSON because no `HomeworkSubmission` model exists in `prisma/schema.prisma`.

