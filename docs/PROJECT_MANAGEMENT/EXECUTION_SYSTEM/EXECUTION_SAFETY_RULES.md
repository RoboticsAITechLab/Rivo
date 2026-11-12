# RIVO — Execution Safety Rules & Operational Boundaries

> **Document:** `EXECUTION_SAFETY_RULES.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO & Security Architect | **Version:** 1.0.0-EXEC  
> **Rule:** Non-negotiable operational boundaries. Violation constitutes an immediate security failure.  

---

## 1. Secrets & Credential Protection Invariants

1. **Never Commit Actual Secrets:** Real database passwords, connection strings, JWT secrets, storage keys, or API tokens must NEVER be committed to Git, staged files, example templates, or chat messages.
2. **Environment Template Sanitization:** Files like `.env.example` must contain ONLY dummy placeholders (e.g. `postgresql://user:password@localhost:5432/dbname`).
3. **Immediate Escalation on Exposed Secret:** If a live secret is discovered in any file, do not copy or display it. Report it using `BLK-001` escalation and trigger provider rotation.
4. **Environment Variable Hygiene:** Always access secrets via `process.env.VARIABLE_NAME`. Never hardcode fallback strings containing production values.

---

## 2. Non-Destructive Database Rules

1. **No Destructive DDL Migrations:** Agents must never generate or execute migrations containing `DROP TABLE`, `DROP COLUMN`, or data truncations on tables with existing records.
2. **Expand-and-Contract Migration Protocol:** When altering schema:
   - Step 1: Add new nullable column (Expand).
   - Step 2: Backfill data via migration script.
   - Step 3: Switch application reads/writes to new column.
   - Step 4: Drop old column in a subsequent release after verification (Contract).
3. **No Direct Production Database Mutations:** DDL migrations must execute via `prisma migrate deploy` through CI/CD pipelines. Never execute ad-hoc DDL queries directly from local terminals against live production databases.
4. **Transaction Timeouts:** Every interactive `prisma.$transaction` must specify an explicit timeout (`timeout: 10000`, `maxWait: 5000`) to prevent transaction starvation under serverless concurrency.

---

## 3. Code Integrity & Testing Safety Rules

1. **Never Disable Security Checks to Make Tests Pass:** Agents are strictly forbidden from commenting out `requireAuth`, bypassing `where: { schoolId }`, or disabling rate limiters to satisfy a test assertion.
2. **Never Ignore Build Errors:** `typescript.ignoreBuildErrors: true` in `next.config.ts` is classified as an immediate P1 blocker. Type errors must be fixed at the root cause.
3. **No Unapproved Third-Party Dependencies:** Agents must not install new npm packages or Flutter dependencies without documenting the business justification and obtaining Lead Orchestrator sign-off.
4. **Preserve Existing Architecture:** Agents must strictly respect the approved architecture (Next.js 16 modular monolith + Flutter mobile). Do not attempt microservices extractions, framework migrations, or state management replacements.
5. **Atomic Reversibility:** Every code change must be atomic and reversible via `git revert`. Never combine multiple unrelated domain changes in a single commit.

