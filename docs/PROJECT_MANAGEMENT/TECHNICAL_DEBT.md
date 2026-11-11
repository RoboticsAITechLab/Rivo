# Technical Debt & Architecture Refactoring Backlog

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Debt Inventory

---

## 1. Technical Debt Inventory

| Debt Item | Impact | Complexity | Location | Recommended Refactoring |
| :--- | :---: | :---: | :--- | :--- |
| **TD-01: Legacy In-Memory Mock Store** | High | Medium | `apps/web/src/shared/mock-store/school-store.ts` (1,532 lines) | 27 frontend files still import from `schoolStore`. Migrate shared entity selectors (`class-select.tsx`, `teacher-select.tsx`) to lightweight React hooks calling real backend REST APIs (`/api/classes`, `/api/teachers`). Deprecate and delete `school-store.ts`. |
| **TD-02: Suppressed TypeScript Build Checking** | High | Low | `apps/web/next.config.ts:6-8` | `next.config.ts` has `typescript: { ignoreBuildErrors: true }`. Remove this setting so type errors fail CI/CD builds before reaching production. |
| **TD-03: Zero Next.js Error Boundaries** | Medium | Low | `apps/web/src/app` | Zero `error.tsx` or `not-found.tsx` files exist in `src/app`. Add standardized error boundaries for `(school)`, `(teacher)`, and `(parent)` route groups. |
| **TD-04: Dead Mock Repository Code** | Low | Trivial | `apps/web/src/features/shared/mock-repository.ts` (318 lines) | Contains completely unreferenced in-memory repository for classes, teachers, and subjects. Safely delete file. |
| **TD-05: Missing Standalone Indexes on Audit Foreign Keys** | Medium | Low | `prisma/schema.prisma` | 37 foreign keys (e.g. `FeePayment.collectedByUserId`, `FeeReceipt.issuedByUserId`, `TeacherDocument.verifiedById`) lack standalone indexes, creating sequential scan overhead on user updates. Add an index migration. |
| **TD-06: DirectUrl Omission in Prisma Schema** | Medium | Trivial | `prisma/schema.prisma:9-12` | Schema defines `url = env("DATABASE_URL")` but omits `directUrl = env("DIRECT_URL")`. Add `directUrl = env("DIRECT_URL")` to allow Prisma CLI to natively use the direct connection for migrations. |
| **TD-07: Inconsistent Storage Container Fallback Names** | Low | Trivial | `apps/web/src/lib/testing/health-adapter.ts` | Default container names in `azure-blob.ts` are `rivo-private` and `rivo-public`, whereas `health-adapter.ts` falls back to `rivo-secure-docs` and `rivo-media`. Align fallbacks. |

