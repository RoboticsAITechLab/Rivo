---
name: production-devops
description: CI/CD automation, Vercel production deployment, zero-downtime database migrations, environment variable hygiene, and rollback runbooks
version: 1.0.0
technologies:
  - GitHub Actions
  - Vercel App Router
  - Prisma Migrate Deploy
sources:
  - https://vercel.com/docs/deployments/overview
  - https://docs.github.com/en/actions
verification_date: 2026-11-11
---

# Production DevOps & CI/CD Engineering Skill

## 1. Purpose & Scope
Deployment pipelines, automated verification gates, zero-downtime database schema migrations, secrets isolation, and production rollback protocols.

## 2. Core Engineering Principles
1. **Three-Tier Environment Isolation**:
   - **Local / Test**: Ephemeral local databases, mock storage.
   - **Staging / Preview**: Full mirror of production schema on Neon branch, isolated Azure storage container, sanitized seed data.
   - **Production**: High-availability Neon project, locked Azure keys, production domain. Never point staging to production databases.
2. **Pre-Deployment Gate Sequence**:
   Every Pull Request must pass:
   ```bash
   npm run prisma:validate      # Schema syntax & relations
   npx tsc --noEmit             # Zero TypeScript errors
   npm run lint                 # Code style & security linters
   npm test                     # Unit & integration tests
   npm run build                # Next.js production compilation
   ```
3. **Database Migration Safety (Expand and Contract)**:
   - When renaming or removing a database column, do NOT drop it in a single migration.
   - Step 1: Add new column, update code to write to both (Expand).
   - Step 2: Backfill existing data.
   - Step 3: Switch reads to new column.
   - Step 4: Drop old column in a subsequent release (Contract).
4. **Automated Migration Execution**: Run `npx prisma migrate deploy` in GitHub Actions using `DIRECT_URL` prior to promoting the application build to production.
5. **Instant Rollback Strategy**: If a production build introduces critical bugs, trigger an instant Vercel rollback to the previous deployment artifact. Schema changes must remain backward-compatible to allow safe instant rollback without database corruption.

## 3. Production Readiness Checklist
- [ ] GitHub Actions workflow enforces TypeScript, linting, tests, and build on PRs.
- [ ] Direct database URL used for migration deployment in CI.
- [ ] Secrets injected via Vercel Environment Variables, never committed to git.
- [ ] Rollback runbook documented and verified.

