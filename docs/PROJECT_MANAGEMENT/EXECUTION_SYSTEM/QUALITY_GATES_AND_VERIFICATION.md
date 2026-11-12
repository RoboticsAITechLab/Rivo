# RIVO — Quality Gates & Verification Standards

> **Document:** `QUALITY_GATES_AND_VERIFICATION.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** QA Director, Security Architect & CTO | **Version:** 1.0.0-EXEC  

---

## 1. The Five Quality Gates Pipeline

Before any task can transition from `IN_PROGRESS` to `VERIFIED` and ultimately `COMPLETED`, it must satisfy the requirements of each applicable quality gate:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     GATE 1      │     │     GATE 2      │     │     GATE 3      │     │     GATE 4      │     │     GATE 5      │
│  Static & Type  │ ──► │ Security & Auth │ ──► │  Transactional  │ ──► │ Evidence Audit  │ ──► │ Rollback Safety │
│   Compilations  │     │ Tenant Scoping  │     │ Functionality   │     │ & Test Proofs   │     │  & Clean Commit │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. Gate Specifications & Pass Criteria

### Gate 1: Static Analysis & Strict TypeScript Compilation
- **Mandatory Commands:**
  ```bash
  npm run prisma:validate
  npx tsc --noEmit
  npm run lint
  ```
- **Pass Criteria:**
  - Zero TypeScript compilation errors (`error TS...` count = 0).
  - No `any` casts in API route handler signatures or domain interfaces.
  - No `eslint-disable` comments suppressing security-critical rules (`no-eval`, `react-hooks/exhaustive-deps`).

### Gate 2: Security & Multi-Tenant Isolation
- **Verification Checks:**
  - **Tenant Scoping:** Every Prisma query touching multi-tenant data contains `where: { schoolId: session.schoolId }`.
  - **No Plaintext Credentials:** Grep audit verifies zero live database URLs, tokens, or private keys in the git diff.
  - **Timing-Safe Crypto:** Token and password comparisons use `crypto.timingSafeEqual`.
  - **Fail-Closed Verification:** Rate limiters and authorization guards fail closed on Redis or datastore degradation.

### Gate 3: Transactional Integrity & Concurrency
- **Verification Checks:**
  - **Financial ACID Transactions:** Payment recording, sequence increments, and allocations run inside `prisma.$transaction`.
  - **Pessimistic Locks:** Concurrency-sensitive rows (fee obligations) queried with `FOR UPDATE` lock.
  - **Double-Entry Balance Math:** `TotalPaid <= TotalObligations - Concessions`. Zero negative balances.

### Gate 4: Evidence-Based Audit & Reproduction Proofs
- **Verification Checks:**
  - An agent claiming a task is done must provide raw terminal output showing test execution and pass assertions.
  - Simulated edge cases must be proven (e.g. concurrent race condition test showing 1 success and 1 lock rejection).
  - Screenshots or visual component state verification for UI tasks.

### Gate 5: Rollback Readiness & Commit Hygiene
- **Verification Checks:**
  - The git working tree is clean.
  - The commit message follows conventional commits: `type(scope): description (TASK-ID)`.
  - A defined revert command is documented in case of regression.

---

## 3. Evidence-Based Completion Checklist Template

Every task execution report must attach this completed checklist to [`EXECUTION_LOG.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/EXECUTION_LOG.md):

```markdown
- [ ] Gate 1: `npx tsc --noEmit` passed cleanly.
- [ ] Gate 1: `npm run prisma:validate` passed without schema errors.
- [ ] Gate 2: Verified zero plaintext secrets in modified files.
- [ ] Gate 2: Verified `where: { schoolId }` present on all tenant queries.
- [ ] Gate 3: Verified database transactions have explicit timeouts.
- [ ] Gate 3: Verified financial math uses `Decimal` or integer cents.
- [ ] Gate 4: Executed test suite and pasted terminal output evidence.
- [ ] Gate 5: Verified rollback procedure (`git revert <hash>`).
```
