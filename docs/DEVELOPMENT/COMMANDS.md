# Verified Development & Build Commands

> **Last Verified:** November 11, 2026  
> **Source Target:** Monorepo root `package.json`, `apps/web/package.json`, `apps/api/package.json`

---

## 1. Monorepo Root Commands

Run these commands from `d:/Rivo`:

| Command | Action / Behavior |
| :--- | :--- |
| `npm ci` | Deterministic dependency installation across all workspaces using `package-lock.json`. |
| `npm run dev` | Boots Next.js development server for `apps/web` on `http://localhost:3000`. |
| `npm run dev:web` | Alias for `npm run dev`. |
| `npm run dev:api` | Starts NestJS development watch mode (`apps/api`) on `http://localhost:4000`. |
| `npm run build` | Triggers `prisma generate && npm run build --workspace=web`. |
| `npm run lint` | Runs Next.js ESLint checks on `apps/web`. |
| `npm run db:seed` | Seeds database via `tsx prisma/seed.ts` (Greenwood Academy demo tenant). |
| `npm run prisma:generate` | Generates Prisma Client (`@prisma/client`) from `prisma/schema.prisma`. |
| `npm run prisma:validate` | Validates syntax and configuration of `prisma/schema.prisma`. |
| `npm run prisma:migrate:deploy` | Applies pending migrations to database (requires direct port 5432 connection). |

---

## 2. Test Execution Commands

```bash
# Run individual test suites via tsx:
npm run test:auth          # 87-point RBAC, session, and password security matrix
npm run test:id            # Atomic sequential ID generator & format preview engine
npm run test:fee           # Fee plans, versioning, installments, obligations
npm run test:academic      # Teacher assignments, timetable clash, exam papers
npm run test:parent        # Parent phone/email OTP and TOTP MFA verification
npm run test:media         # Azure Blob SAS upload, magic-bytes, quota guards
npm run test:remediation   # Environment validation & fail-closed security hardening
npm run test:observability # Testing Center API routes, metric collection, sanitizers
npm run test:phase         # Academic results, notices, and audience communication

# Run all 9 test suites sequentially:
npm test
```

> [!NOTE]
> **Database Requirement for Tests:** Rivo test suites are end-to-end integration tests that query a live PostgreSQL database. When running locally without active internet access to Neon, pure unit functions (such as ID prefix derivation) will pass, but database queries will fail with `PrismaClientInitializationError: Can't reach database server`. Ensure your local PostgreSQL instance is running or Neon is reachable before running `npm test`.

---

## 3. TypeScript Compilation Audit

```bash
# Verify 100% clean TypeScript compilation without generating cache locks:
npx tsc --project apps/web/tsconfig.json --noEmit --incremental false
```

