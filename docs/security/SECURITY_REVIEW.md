# Comprehensive Security, Architecture & Quality Audit Report

> **Audit Date:** November 11, 2026  
> **Auditor Role:** Security & Quality Auditor  
> **Target:** `apps/web`, `apps/api`, `packages/*`, `prisma/schema.prisma`  
> **Classification:** Audit Only (No application source code modified)

---

## 1. Executive Summary

A comprehensive, code-first audit was conducted across authentication mechanisms, authorization boundaries, role-based access control, cryptographic handling, file uploads, and error handling.

The system demonstrates high cryptographic maturity in field-level KYC encryption (AES-256-GCM), TOTP MFA mechanics, and database transactions. However, the audit identified **two Critical vulnerabilities, five High-severity risks, and several quality/debt items** that require immediate remediation.

---

## 2. Prioritized Vulnerability & Risk Findings

| ID | Severity | Category | Title | Affected File / Component |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | Secrets / Data Protection | Live Neon DB Connection String Committed to Git | `apps/api/.env.example`, `apps/web/.env.example` |
| **SEC-02** | **CRITICAL** | Financial Integrity / Concurrency | Lost-Update Race Condition in Fee Payment Allocations | `apps/web/src/lib/fees/fee-payment-service.ts` |
| **SEC-03** | **HIGH** | Authorization / IDOR | Broken Object Level Authorization on Student Profile | `apps/web/src/app/api/students/[id]/route.ts` |
| **SEC-04** | **HIGH** | Authorization / Scoping | Cartesian Product Scoping Flaw in Teacher Student Lists | `apps/web/src/app/api/students/route.ts` |
| **SEC-05** | **HIGH** | Authentication / Timing | Account Enumeration & Timing Side-Channel on Login | `apps/web/src/app/api/auth/login/route.ts` |
| **SEC-06** | **HIGH** | Reliability / Rate Limiting | RateLimiter Fails Open in Production Mode on Redis Downtime | `apps/web/src/lib/auth/rate-limiter.ts` |
| **SEC-07** | **HIGH** | Authentication / State | Parent Multi-School Switching Desynchronizes Redis Cache | `apps/web/src/app/api/auth/parent/select-school/route.ts` |
| **SEC-08** | **MEDIUM** | Authentication / Identity | Unauthenticated Parent User Account Auto-Provisioning | `apps/web/src/app/api/auth/parent/otp/request/route.ts` |
| **SEC-09** | **MEDIUM** | Concurrency / MFA | Non-Atomic MFA Recovery Code Consumption Race | `apps/web/src/lib/auth/mfa.ts` |
| **SEC-10** | **MEDIUM** | Security Headers | Missing Content-Security-Policy (CSP) and HSTS Headers | `apps/web/src/middleware.ts` |
| **SEC-11** | **MEDIUM** | Build & Code Quality | TypeScript Build Type-Checking Suppressed in Production | `apps/web/next.config.ts` |
| **SEC-12** | **HIGH (Debt)** | Architecture / Technical Debt | Widespread Coupling to 1,500-Line In-Memory Mock Store | `apps/web/src/shared/mock-store/school-store.ts` |

---

## 3. Deep-Dive Vulnerability Analysis

### SEC-01 [CRITICAL]: Live Neon DB Connection String Committed to Git
- **Location:** `apps/api/.env.example:9`, `apps/web/.env.example:6-7`
- **Finding:** A live connection string for a Neon PostgreSQL database (`ep-wild-river-b5k25flk-pooler.c-7.us-east-2.aws.neon.tech`) was committed to tracked `.env.example` template files.
- **Risk:** Anyone with repository read access can connect directly to the database cluster, bypassing all application-level tenant isolation, rate limits, and audit logs.
- **Remediation:**
  1. Immediately rotate database passwords in the Neon Console.
  2. Rewrite git history using `git-filter-repo` to permanently remove credentials.
  3. Replace all examples with sanitized placeholders (`postgresql://user:password@host/neondb`).

### SEC-02 [CRITICAL]: Lost-Update Race Condition in Fee Payments
- **Location:** `apps/web/src/lib/fees/fee-payment-service.ts:88-206`
- **Finding:** Under PostgreSQL's default `READ COMMITTED` isolation level, `tx.feeObligation.findMany` reads obligation balances into Node.js application memory without acquiring database row locks (`SELECT ... FOR UPDATE`).
- **Risk:** Two concurrent fee payments for the same student (e.g. parent paying online while school cashier records cash) read identical outstanding balances and overwrite each other, causing negative balances or unrecorded payments.
- **Remediation:** Implement a distributed Redis mutex lock (`redlock`) around `recordFeePayment` keyed by `school:${schoolId}:student:${data.studentId}`, or execute atomic SQL updates (`UPDATE fee_obligations SET paid_amount = paid_amount + $1 ...`).

### SEC-03 [HIGH]: Broken Object Level Authorization on Student Detail
- **Location:** `apps/web/src/app/api/students/[id]/route.ts:14-55`
- **Finding:** While the list endpoint (`GET /api/students`) restricts teachers to assigned sections (`auth.scope === 'ASSIGNED'`), the detail endpoint `GET /api/students/[id]` only filters by `schoolId`.
- **Risk:** Any teacher can view any student's complete record across the entire school—including guardian contact details, personal address, legal documents, fee obligations, and payment history.
- **Remediation:** Add an explicit scope check: if `auth.scope === 'ASSIGNED'`, verify the teacher has an active `TeacherAssignment` covering the student's enrolled class/section.

### SEC-04 [HIGH]: Cartesian Product Authorization Leak in Teacher Student Lists
- **Location:** `apps/web/src/app/api/students/route.ts:147-157`
- **Finding:** Teacher assignments are checked via independent `in` filters:
  `where.enrollments = { some: { classId: { in: assignedClassIds }, sectionId: { in: assignedSectionIds } } }`
- **Risk:** If a teacher is assigned to Class 9-A and Class 10-B, the query matches students in Class 9-B and Class 10-A.
- **Remediation:** Replace independent `in` filters with an `OR` array of paired conditions:
  `where.enrollments = { some: { OR: teacher.assignments.map(a => ({ classId: a.classId, sectionId: a.sectionId })) } }`

### SEC-05 [HIGH]: Account Enumeration & Timing Side-Channel in Login
- **Location:** `apps/web/src/app/api/auth/login/route.ts:64-85`
- **Finding:** If a user is not found, the endpoint returns immediately (~2-5ms). If found, it runs `crypto.scrypt` (~80ms). Furthermore, explicit messages distinguish OTP accounts from password accounts.
- **Remediation:** Execute a dummy `crypto.scrypt` computation on unknown emails to equalize timing, and unify error messages to `'Invalid email or password.'`.

### SEC-06 [HIGH]: RateLimiter Fails Open in Production When Redis is Down
- **Location:** `apps/web/src/lib/auth/rate-limiter.ts:49-84`
- **Finding:** When Redis is unreachable in production, `RateLimiter` falls back to process-local in-memory storage. On Vercel serverless lambdas, each incoming request spawns a fresh instance with empty memory, allowing unlimited brute-force attempts.
- **Remediation:** When `isProductionMode()` is true and Redis is unreachable, return `{ allowed: false, remaining: 0, resetAt: ... }` (Fail Closed).

### SEC-07 [HIGH]: Stale Session Cache on Parent Multi-School Switching
- **Location:** `apps/web/src/app/api/auth/parent/select-school/route.ts:44-48`
- **Finding:** When a multi-school parent switches active schools, PostgreSQL is updated, but Redis session cache `rivo:session:<tokenHash>` is **not invalidated**.
- **Risk:** Subsequent requests read the cached session with the old `schoolId` for up to 5 minutes, causing cross-school data desynchronization.
- **Remediation:** Invoke `await invalidateSessionCache(tokenHash, session.userId)` immediately following the database update.

---

## 4. Remediation Action Plan

1. **Immediate P0 (24 Hours):**
   - Rotate Neon database credentials.
   - Clean `.env.example` templates.
   - Fix RateLimiter fail-closed logic.
   - Patch IDOR in `GET /api/students/[id]`.
2. **Short-Term P1 (1 Week):**
   - Add Redis distributed lock around fee payments.
   - Patch Cartesian product query in `GET /api/students`.
   - Invalidate Redis session cache in `select-school`.
   - Mount `<Toaster />` in `apps/web/src/app/layout.tsx`.
3. **Medium-Term P2 (2 Weeks):**
   - Add CSP and HSTS headers in `middleware.ts`.
   - Remove `typescript: { ignoreBuildErrors: true }` from `next.config.ts`.
   - Deprecate `school-store.ts` in favor of direct API hooks.

