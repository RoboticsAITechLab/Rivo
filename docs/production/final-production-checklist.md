# Final Production Deployment & System-Wide Verification Checklist

This checklist defines the mandatory operational gates for launching the Rivo institutional ERP platform in production.

---

## 1. Security & Cryptography

- [x] **Zero Hardcoded Secrets:** Full repository audit verified that no production secrets or passwords exist in source code.
- [x] **Production JWT Secret Fail-Closed Policy:** `apps/web/src/lib/auth/crypto.ts` strictly validates `JWT_SECRET`. Throws fatal error if unset, less than 32 characters, or matching common placeholders in production.
- [x] **Mandatory Production KYC Key:** `apps/web/src/lib/security/encryption.ts` mandates a dedicated `KYC_ENCRYPTION_KEY` in production (no fallback to `JWT_SECRET`).
- [x] **AES-256-GCM Encryption at Rest:** Teacher and student identity document numbers are encrypted with 96-bit unique IVs and 128-bit authentication tags before database persistence.
- [x] **Identity Number Masking:** APIs mask sensitive identity numbers (showing only the last 4 characters) across all responses.
- [x] **Server-Side Edge Route Guards:** `apps/web/src/middleware.ts` enforces authentication on `/school/:path*`, `/teacher/:path*`, and `/parent/:path*`, and sets HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- [ ] **External Action: Historical Credential Rotation:** Rotate Azure Storage Account Key in Azure Portal (`portal.azure.com`) due to historical commit `dbf0146`. (See `docs/production/secret-rotation.md`).

---

## 2. Upstash Redis & Distributed Rate Limiting

- [x] **Enforced TLS Transit:** `apps/web/src/lib/redis/client.ts` automatically forces `rediss://` for all Upstash endpoints.
- [x] **Fail-Closed Security Policy:** Rate limiting paths (login, password reset, MFA, invitations) strictly fail closed in production if Redis is unreachable or unconfigured.
- [x] **Zero Unsafe Memory Fallback in Production:** Process-local memory fallback is blocked whenever `NODE_ENV=production` or `AUTH_INFRA_MODE=production`.
- [x] **Sanitized Error Logging:** Connection error handlers scrub credentials, tokens, and raw connection strings from logs.
- [x] **Serverless Fail-Fast:** `enableOfflineQueue: false` configured so functions fail immediately rather than queueing until Vercel execution timeout.
- [ ] **External Action: Vercel Variable Configuration:** Ensure `REDIS_URL` or `UPSTASH_REDIS_URL` is set in Vercel Project Settings.

---

## 3. Institutional Settings Enforcement & Tenant Isolation

- [x] **Direct DB Source of Truth:** Settings UI updates persist atomically to the `SchoolSetting` table in PostgreSQL with version concurrency tracking.
- [x] **Zero Stale/Mock Data:** `mockRepository` is eliminated from all active features.
- [x] **Attendance Settings Runtime Enforcement:**
  - `attendanceEnabled`: Checked before attendance roster access.
  - `teacherCanMark`: Enforced on faculty submissions.
  - `lockPreviousRecords`: Rejects past-date submissions by non-administrators.
  - `supportedStatuses`: Validates status codes against institutional whitelist.
- [x] **Homework Settings Runtime Enforcement:**
  - `teacherCanCreate`: Enforced on faculty homework creation.
  - `attachmentsEnabled`: Blocks file attachments if disabled.
- [x] **Communication Settings Runtime Enforcement:**
  - `teacherCanCreate`: Controls circular creation.
  - `teacherCanPublish`: Forces administrative approval workflow when direct broadcast is disabled.
- [x] **Security / Password Policy Runtime Enforcement:**
  - `validatePasswordPolicy`: Dynamically enforces institution-configured minimum length and complexity rules.
- [x] **Multi-Tenant Isolation:** All settings queries and mutations strictly filter by `auth.schoolId` from the authenticated session. Verified that School A cannot read or modify School B settings.

---

## 4. Database & Migrations

- [x] **Zero Schema Drift:** Autoritative `prisma/schema.prisma` and `apps/web/prisma/schema.prisma` are synchronized (0 differences).
- [x] **Safe Migrations:** Applied migration `20261008200000_homework_system` via `prisma migrate deploy`.
- [x] **Data Preservation:** Zero `prisma db push` or `prisma migrate reset` operations executed. Existing institutional data is preserved.
- [x] **Compiled Engine Binaries Untracked:** All `*.dll.node` files untracked from Git and excluded in `.gitignore`.

---

## 5. Testing & Code Quality Gates

- [x] **TypeScript Compiler:** `npx tsc --noEmit` passes with 0 errors across all workspaces.
- [x] **Production Bundle Build:** Next.js Turbopack build generates 161 static and dynamic pages and 105 API routes with 0 errors.
- [x] **Regression Test Suite:** Automated test suites verify authentication, RBAC, KYC encryption, Redis fail-closed policies, tenant isolation, and homework persistence.
