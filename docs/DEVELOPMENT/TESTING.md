# Testing & Observability Guide

> **Last Verified:** November 11, 2026  
> **Source Target:** `apps/web/src/__tests__`, `apps/web/src/app/api/testing-center`, `apps/web/src/lib/testing`

---

## 1. Testing Architecture Overview

Rivo employs a two-tier testing strategy:
1. **Automated CLI Integration Test Suites:** Executed via `tsx` across 9 core domains in CI/CD (`npm test`).
2. **In-App Testing & Observability Center:** A live, browser-accessible testing workbench at `/testing-center` that platform operators can run against staging or production environments.

---

## 2. CLI Integration Test Suites (`apps/web/src/__tests__`)

The repository contains **27 test files** in `apps/web/src/__tests__`. The 9 primary suites wired into `npm test` include:

| Test Script | Test Target File | Scope of Coverage |
| :--- | :--- | :--- |
| `npm run test:auth` | `auth-matrix.test.ts` | 87-point authorization matrix checking role boundaries (`DIRECTOR`, `PRINCIPAL`, `TEACHER`, `FEE_MANAGER`), session tokens, and Scrypt verification. |
| `npm run test:id` | `id-generator.test.ts` | Atomic sequential generation of student admission numbers, employee IDs, and payment receipt numbers. |
| `npm run test:fee` | `fee-management-foundation.test.ts` | Fee plan math invariants, installment schedules, obligation generation, payment allocations, and receipt numbering. |
| `npm run test:academic` | `teacher-timetable-exam.test.ts` | Timetable collision engine, exam paper scheduling, teacher double-booking, and room collisions. |
| `npm run test:parent` | `parent-identity-otp-mfa.test.ts` | Parent mobile OTP generation, 60s cooldowns, 5 attempt lockouts, and RFC 6238 TOTP verification. |
| `npm run test:media` | `media-storage-azure.test.ts` | Azure Blob SAS token generation, 15m expiration, 2MB/3MB/10MB quota checks, and binary magic-byte inspection. |
| `npm run test:remediation` | `remediation-forensic-hardening.test.ts` | Production fail-closed security assertions, Redis offline behavior, and secret validation. |
| `npm run test:observability` | `testing-observability-center.test.ts` | Telemetry aggregation, latency percentiles, and credential sanitization. |
| `npm run test:phase` | `phase-results-notices-communication.test.ts` | Mark tabulation, CBSE 8-band grading, notice circulars, and communication group resolution. |

---

## 3. In-App Testing & Observability Center (`/testing-center`)

Platform operators with `PlatformRole.OWNER` or `PLATFORM_ADMIN` can access the in-app testing workbench:
- **URL:** `http://localhost:3000/testing-center` (Legacy `/admin/testing` redirects here).
- **Security:** Guarded by `authorizeTestingOperator()`. Non-platform users receive `HTTP 403 Forbidden`. The route emits `X-Robots-Tag: noindex, nofollow, noarchive`.

### Capabilities:
1. **Live Health Checks (`/api/testing-center/health`):** Real-time latency and connectivity checks for PostgreSQL, Upstash Redis, Azure Blob Storage, and Resend API.
2. **End-to-End Regression Runner (`/api/testing-center/regression`):** Triggers automated API tests across student admission, fee payments, and attendance.
3. **Synthetic Load Tester (`/api/testing-center/load-test`):** Simulates concurrent traffic, measuring p50, p95, and p99 latency percentiles and error distribution.
4. **Export Engine (`/api/testing-center/runs/[id]/export`):** Exports test reports in **JSON**, **CSV**, or formatted **HTML** with all passwords, tokens, and keys automatically redacted (`[REDACTED]`).

