# RIVO — Module 14: Testing, QA, SRE & Observability

> **Document:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** SRE Lead & QA Director | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Establish world-class quality engineering, hermetic automated test runners, Playwright cross-application end-to-end journey tests, structured JSON telemetry, deep readiness health probes, k6 load testing, and verified disaster recovery runbooks.

---

## 2. Existing Implementation Status
- 9 test suites exist in `apps/web/src/__tests__`.
- Active flaw: `npm run test:id` fails offline due to live cloud Neon database coupling (TEST-01).
- Active flaw: Ad-hoc `console.log` statements throughout API routes without structured correlation IDs.
- Active flaw: No deep readiness health check endpoint verifying database and Redis connectivity.

---

## 3. Required Final Functionality
- Hermetic local test database runner allowing complete offline execution of all test suites.
- Structured JSON logging wrapper emitting `timestamp`, `level`, `requestId`, `schoolId`, `route`, and latency.
- Deep readiness health probe at `GET /api/health/ready` verifying active connectivity to PostgreSQL and Redis.
- Playwright E2E journey test: Admin admits student -> Teacher marks attendance -> Parent pays fee -> Receipt downloads.
- k6 load testing validating sub-350ms p95 latency under 5,000 simulated concurrent requests.

---

## 4. Technical Requirements
- Node.js test runner / tsx with isolated test SQLite/PostgreSQL instance.
- Playwright for multi-browser and mobile viewport end-to-end testing.
- k6 for API load testing.

---

## 5. QA & Testing Tasks
- `RIVO-QA-001`: Implement hermetic test database runner in `apps/web/src/__tests__/test-database-harness.ts` so `npm run test:id` runs offline.
- `RIVO-QA-002`: Build Playwright cross-application end-to-end journey test suite in `apps/web/e2e/`.

---

## 6. SRE & Observability Tasks
- `RIVO-SRE-001`: Build structured JSON logger in `apps/web/src/lib/logger.ts` and deploy across route handlers.
- `RIVO-SRE-002`: Implement deep readiness health probe at `apps/web/src/app/api/health/ready/route.ts`.
- `RIVO-SRE-003`: Build and execute k6 load test script (`tests/load/k6-roster-spike.js`) optimizing PgBouncer pool limits.
- `RIVO-SRE-004`: Execute and document Neon Point-in-Time Recovery (PITR) restore test on a staging branch.

---

## 7. Database Tasks
- Verify `ServiceHealthCheck` and `TestRun` models in `prisma/schema.prisma`.
- Configure PgBouncer pool limits (`connection_limit=10&pool_timeout=10`) in Prisma connection URLs.

---

## 8. API Requirements
- `GET /api/health/ready`: Deep probe returning HTTP 200 with `{ status: "healthy", checks: { db: "ok", redis: "ok" } }`, or HTTP 503 if any datastore is degraded.
- `GET /api/health/live`: Lightweight liveness check returning HTTP 200.

---

## 9. Security Requirements
- Log payloads strictly sanitized: Passwords, session tokens, and student Aadhaar numbers masked (`[REDACTED]`).
- Health probes rate-limited to prevent denial-of-service probing.

---

## 10. UI/UX Requirements
- Observability Center in `/testing-center` displaying live latency percentiles, error rates, and active test runs.

---

## 11. Integration Dependencies
- Monitors all backend route handlers and cloud datastores (Neon, Upstash, Azure).

---

## 12. Error and Edge-Case Handling
- Inability to reach database returns HTTP 503 within 2 seconds (strict timeout, no hung requests).
- Failed E2E test runs auto-capture trace files and failure screenshots in `apps/web/playwright-report/`.

---

## 13. Testing Strategy
- Unit test log sanitization filter.
- Playwright E2E matrix: Chromium, WebKit, Mobile Safari, Mobile Chrome.
- Load test: Ramp from 100 to 5,000 requests/sec over 5 minutes.

---

## 14. Acceptance Criteria
- [ ] `npm test` runs 100% offline without network errors.
- [ ] `/api/health/ready` returns HTTP 503 when Redis or database is disconnected.
- [ ] Playwright E2E suite passes end-to-end across web and mobile viewports.
- [ ] k6 load test demonstrates p95 latency < 350ms.

---

## 15. Deployment Considerations
- Vercel monitoring integration and external uptime pinger (e.g. BetterStack / UptimeRobot) targeting `/api/health/ready`.

---

## 16. Completion Checklist
- [ ] `RIVO-QA-001` completed.
- [ ] `RIVO-QA-002` completed.
- [ ] `RIVO-SRE-001` completed.
- [ ] `RIVO-SRE-002` completed.
- [ ] `RIVO-SRE-003` completed.
- [ ] `RIVO-SRE-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Running high-concurrency load tests against cloud databases must be performed on dedicated staging branches to avoid affecting pilot school performance.

