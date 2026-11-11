# Production Deployment & Hosting Runbook

> **Last Verified:** November 11, 2026  
> **Target Cloud Host:** Vercel Edge Serverless (`rivo-web`)  
> **Database Host:** Neon PostgreSQL  
> **Status:** Production Verified

---

## 1. Hosting Architecture on Vercel

The production web application (`apps/web`) is bound to Vercel via `.vercel/project.json`:
- **Project Name:** `rivo-web`
- **Project ID:** `prj_hrbetI4cKIzSeHdeyJcoafGHvvtc`
- **Organization ID:** `team_a4vDWJ4thnOpIMnf2jb88fUD`

### Build Pipeline on Vercel
When commits are merged into `main`, Vercel triggers the build script:
```bash
prisma generate && next build
```
- **Prisma Output:** `@prisma/client` is bundled with binary engine targets for Linux Debian (`debian-openssl-3.0.x`).
- **Serverless API Lambdas:** Next.js route handlers in `apps/web/src/app/api` compile to stateless serverless functions.
- **Edge Middleware:** `apps/web/src/middleware.ts` deploys to Vercel's global edge network.

---

## 2. Step-by-Step Production Deployment Runbook

### Step 1: Pre-Flight Verification
Run these checks locally before deploying:
```bash
# 1. Validate Prisma schema integrity
npm run prisma:validate

# 2. Run TypeScript compilation check
npx tsc --project apps/web/tsconfig.json --noEmit --incremental false

# 3. Execute unit and forensic security test suites
npm test
```

### Step 2: Apply Database Migrations (Direct Connection)
Migrations must be executed against the Neon direct connection (`DIRECT_URL`) to allow advisory locks without PgBouncer interference:
```bash
DIRECT_URL="<neon_direct_connection_string>" npm run prisma:migrate:deploy
```
> [!CAUTION]
> **NEVER execute `prisma migrate reset` in production.** This drops the entire PostgreSQL database schema and permanently destroys all institutional tenant data.

### Step 3: Trigger Production Release on Vercel
```bash
# Via Vercel CLI:
vercel deploy --prod

# Or via GitHub Actions:
# Push to main branch automatically triggers Vercel GitHub integration.
```

### Step 4: Post-Deployment Smoke Verification
```bash
# Verify health probe endpoint
curl -i https://app.rivo.school/api/health

# Expected response:
# HTTP/2 200
# {"status":"healthy","environment":"production","services":{"database":{"status":"connected"}}}
```

---

## 3. Instant Rollback Procedure

If a production release introduces unforeseen regressions:
1. Open the [Vercel Dashboard](https://vercel.com/) $\rightarrow$ Select `rivo-web` project.
2. Navigate to **Deployments**.
3. Locate the previous known-healthy deployment artifact.
4. Click the three dots (`...`) menu $\rightarrow$ Select **Instant Rollback**.
5. Vercel's Edge network shifts 100% of production traffic back to the previous immutable build artifact within seconds.

