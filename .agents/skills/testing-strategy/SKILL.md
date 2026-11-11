---
name: testing-strategy
description: Multi-tenant SaaS automated testing, financial transaction testing, RBAC matrix verification, and integration test suites
version: 1.0.0
technologies:
  - Vitest / Node Test Runner
  - tsx / TypeScript
  - Prisma Test Transactions
sources:
  - https://martinfowler.com/articles/practical-test-pyramid.html
  - https://vitest.dev/guide/
verification_date: 2026-11-11
---

# Testing Strategy & Quality Engineering Skill

## 1. Purpose & Scope
Architecting automated test pyramids for multi-tenant SaaS applications, validating financial calculations, RBAC permission matrices, IDOR isolation, and end-to-end critical school management workflows.

## 2. Core Engineering Principles
1. **Risk-Weighted Test Pyramid**:
   - **Unit Tests**: Pure business logic (fee allocation math, password hashing, timetable conflict detection, roll number generation). Fast, zero network dependencies.
   - **Integration Tests**: Prisma transactions, multi-tenant scoping, database constraints, auth middleware validation against a test PostgreSQL instance.
   - **End-to-End Tests**: Critical school admin journeys (student admission, fee collection, report card generation).
2. **Multi-Tenant Cross-Access Tests**: Every critical entity must have an automated test verifying that School A's authenticated session receives HTTP 404 or 403 when requesting School B's resource ID.
3. **Financial Concurrency Simulation**: Test suites for fee collection must simulate parallel payment requests against a single student obligation to prove absence of duplicate allocations or negative balances.
4. **Hermetic Test Environments**: Tests must not rely on shared production or long-lived staging database state that can become dirty. Use transaction rollbacks or ephemeral Neon branch databases for test suites.
5. **No Flaky Tests in CI**: Flaky tests erode team confidence. Tests with race conditions, unpinned timestamps, or unhandled async promises must be quarantined and fixed immediately.

## 3. Recommended Implementation Patterns

### Multi-Tenant Isolation Test Pattern
```typescript
test('Tenant A cannot access Student belonging to Tenant B', async () => {
  const schoolA = await createTestSchool('School A');
  const schoolB = await createTestSchool('School B');
  const studentB = await createTestStudent(schoolB.id);

  const sessionA = await createTestSession(schoolA.id);

  const response = await request(app)
    .get(`/api/students/${studentB.id}`)
    .set('Cookie', `rivo_session=${sessionA.token}`);

  expect(response.status).toBe(404); // Must not reveal existence
});
```

## 4. Production Readiness Checklist
- [ ] RBAC matrix test suite passes across all 8 user roles (`SUPER_ADMIN`, `ADMIN`, `PRINCIPAL`, `TEACHER`, `ACCOUNTANT`, `STUDENT`, `PARENT`, `STAFF`).
- [ ] Financial payment allocation and reversal tested under simulated concurrency.
- [ ] Automated CI test runner executes cleanly against isolated test database.

