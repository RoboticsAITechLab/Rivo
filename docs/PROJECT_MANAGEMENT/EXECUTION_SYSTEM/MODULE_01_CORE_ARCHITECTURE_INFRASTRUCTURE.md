# RIVO — Module 01: Core Architecture & Shared Infrastructure

> **Document:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Principal Software Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Establish a clean, strictly-typed, scalable, and resilient foundation across the npm workspaces (`apps/web`, `apps/api`, `apps/parent`, `packages/*`), enabling zero-leakage database pooling, strict build verification, resilient client error boundaries, and activated monorepo packages.

---

## 2. Existing Implementation Status
- `apps/web`: Next.js 16.3.5 App Router monolith with Turbopack and React 19.2.8.
- `apps/api`: Dormant NestJS 12.0.1 scaffold prototype (isolated from production).
- `packages/config`, `packages/types`, `packages/validation`: Monorepo placeholders with README only.
- `apps/web/next.config.ts`: Contains `typescript.ignoreBuildErrors: true` (TD-02).
- `apps/web/src/app/layout.tsx`: Missing Sonner `<Toaster />` (TD-03).
- `apps/web/src/app`: Missing root and route-group `error.tsx` and `not-found.tsx` (TD-04).

---

## 3. Required Final Functionality
- `packages/types` and `packages/validation` activated and exporting shared schemas/models.
- Next.js build compilation enforces strict TypeScript type checking (`ignoreBuildErrors: false`).
- Root layout mounts `<Toaster />` and catches unhandled route errors via graceful fallback screens.
- Global Prisma client singleton in `apps/web/src/lib/prisma.ts` with connection pooling and timeouts.

---

## 4. Technical Requirements
- Node.js 20+ LTS, npm workspaces, Next.js 16.3.5, React 19, TypeScript 5.x.
- Dual database connection: `DATABASE_URL` (pooled port 6543) and `DIRECT_URL` (direct port 5432).

---

## 5. Frontend Tasks
- `RIVO-UI-001`: Mount `<Toaster position="top-right" richColors />` in `apps/web/src/app/layout.tsx`.
- `RIVO-UI-002`: Implement `apps/web/src/app/error.tsx`, `apps/web/src/app/not-found.tsx`, and `apps/web/src/app/(school)/error.tsx`.

---

## 6. Backend Tasks
- `RIVO-ARCH-001`: Formulate `packages/types/src/index.ts` exporting shared TypeScript domain interfaces.
- `RIVO-ARCH-002`: Formulate `packages/validation/src/index.ts` exporting Zod validation schemas.
- `RIVO-BLD-001`: Fix all TypeScript compilation errors across `apps/web` and set `ignoreBuildErrors: false`.

---

## 7. Database Tasks
- `RIVO-DB-001`: Deploy composite index `@@index([schoolId, role])` on `SchoolMembership`.
- Verify singleton instantiation in `apps/web/src/lib/prisma.ts` prevents connection leaks.

---

## 8. API Requirements
- Route handlers enforce `export const dynamic = 'force-dynamic'` for authenticated tenant endpoints.
- Max duration config: `export const maxDuration = 30` on serverless endpoints.

---

## 9. Security Requirements
- Security headers in `apps/web/src/middleware.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Strict CORS rules restricting origins to authorized school subdomains and local development.

---

## 10. UI/UX Requirements
- Clean error boundary UI displaying reference error digest code, friendly explanation, and "Try Again" recovery action.
- Toast notifications positioned top-right with auto-dismiss after 4 seconds.

---

## 11. Integration Dependencies
- Consumed by all downstream feature modules (Modules 02 through 14).

---

## 12. Error and Edge-Case Handling
- Uncaught RSC render exceptions captured by `error.tsx` without white-screen crash.
- Missing resources return `not-found.tsx` with clear link to return to dashboard.

---

## 13. Testing Strategy
- Static check: `npx tsc --noEmit` must exit with 0.
- Schema check: `npm run prisma:validate` must exit with 0.
- Build check: `npm run build` must succeed without warnings.

---

## 14. Acceptance Criteria
- [ ] `ignoreBuildErrors` is false in `next.config.ts`.
- [ ] `<Toaster />` visible on form submissions calling `toast.success()`.
- [ ] `error.tsx` displays properly when a simulated error is thrown in a test route.

---

## 15. Deployment Considerations
- Vercel build command: `npm run build` which invokes `prisma generate && next build`.

---

## 16. Completion Checklist
- [ ] `RIVO-ARCH-001` completed.
- [ ] `RIVO-ARCH-002` completed.
- [ ] `RIVO-BLD-001` completed.
- [ ] `RIVO-UI-001` completed.
- [ ] `RIVO-UI-002` completed.
- [ ] `RIVO-DB-001` completed.

---

## 17. Known Risks and Unresolved Decisions
- Resolving strict TypeScript errors may surface hidden type mismatches in legacy mock components requiring surgical typing.

