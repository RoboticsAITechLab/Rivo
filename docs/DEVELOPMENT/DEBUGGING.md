# Debugging & Operational Troubleshooting

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Troubleshooting Procedures

---

## 1. Common Development Issues & Resolutions

### 1.1 "Can't reach database server" (`PrismaClientInitializationError`)
- **Symptom:** Running tests or starting dev server fails with:
  `Can't reach database server at ep-wild-river-...pooler.neon.tech:5432`
- **Root Cause:** Neon serverless compute instances automatically scale to zero (pause) after 5 minutes of inactivity. Additionally, sandbox terminal commands without network access cannot reach remote cloud endpoints.
- **Resolution:**
  1. If running against Neon, issue a query from the Neon Console to wake the compute endpoint.
  2. For local offline development, start a local PostgreSQL container:
     ```bash
     docker run -d --name rivo-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rivo_dev postgres:15-alpine
     ```
  3. Update `DATABASE_URL` in `apps/web/.env.local` to point to `localhost:5432`.

### 1.2 Invisible Toast Notifications
- **Symptom:** UI actions succeed, but no toast feedback is displayed on screen.
- **Root Cause:** 46+ components invoke `toast.success()` / `toast.error()` from `sonner`, but `<Toaster />` is missing from `apps/web/src/app/layout.tsx`.
- **Resolution:** Import `Toaster` from `sonner` and mount it inside `apps/web/src/app/layout.tsx`:
  ```tsx
  import { Toaster } from 'sonner';
  // Inside RootLayout:
  <Toaster position="top-right" richColors />
  ```

### 1.3 TypeScript Compilation Lock (`EPERM: tsconfig.tsbuildinfo`)
- **Symptom:** Running `npx tsc` fails with permission errors writing `tsconfig.tsbuildinfo`.
- **Resolution:** Pass `--incremental false` during one-off validation checks:
  ```bash
  npx tsc --project apps/web/tsconfig.json --noEmit --incremental false
  ```

### 1.4 Stale Session Cache After Role or School Switch
- **Symptom:** An admin changes a user's role or a parent switches active schools, but permissions do not take effect immediately.
- **Root Cause:** Redis caches active sessions for 300 seconds (5 minutes) under `rivo:session:<tokenHash>`.
- **Resolution:** Invoke `invalidateSessionCache(tokenHash, userId)` in `apps/web/src/lib/auth/session-cache.ts` during role/school updates, or clear Redis cache manually:
  ```bash
  redis-cli -u <REDIS_URL> KEYS "rivo:session:*" | xargs redis-cli -u <REDIS_URL> DEL
  ```

### 1.5 Database Migration Advisory Lock Timeout
- **Symptom:** Running `prisma migrate deploy` hangs or fails with lock errors.
- **Root Cause:** Running migrations through PgBouncer connection poolers (`port 6543`) prevents PostgreSQL session-level advisory locks from working properly.
- **Resolution:** Ensure migrations run exclusively against the **direct** connection (`DIRECT_URL` on `port 5432` without PgBouncer).

