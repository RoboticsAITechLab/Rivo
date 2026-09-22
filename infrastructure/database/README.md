# Database Architecture & Connection Topology

Rivo utilizes **Neon Serverless PostgreSQL** as its primary relational store.

## Connection Architecture

Neon provides two distinct connection endpoints:

1. **Pooled Connection (`DATABASE_URL`):**
   - Uses Neon's built-in PgBouncer connection pooler on port `6543`.
   - Appended with query parameters: `?pgbouncer=true&connect_timeout=15`.
   - Used by the Next.js runtime (`apps/web`) to prevent database connection exhaustion during high-concurrency serverless executions.
2. **Direct Connection (`DIRECT_URL`):**
   - Connects directly to the underlying PostgreSQL instance on port `5432`.
   - Used exclusively for schema migrations (`prisma migrate deploy`) and DDL statements that require session-level locking.

## Multi-Tenant Isolation Model

All domain tables implement logical multi-tenancy:
- Every table (except global system entities like `User` and `School`) includes a `schoolId` foreign key referencing `School(id)`.
- All database queries derived from API route handlers extract `schoolId` directly from the authenticated session context.
- Composite unique constraints (e.g., `[schoolId, admissionNumber]`, `[schoolId, entityType, year]`) guarantee uniqueness within a tenant without cross-tenant collisions.
