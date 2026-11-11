---
name: postgresql-performance
description: High-performance PostgreSQL indexing, PgBouncer connection pooling, slow query diagnostics, and N+1 query elimination
version: 1.0.0
technologies:
  - PostgreSQL 15/16
  - Neon Serverless Postgres
  - PgBouncer
sources:
  - https://www.postgresql.org/docs/current/performance-tips.html
  - https://neon.tech/docs/connect/connection-pooling
  - https://use-the-index-luke.com
verification_date: 2026-11-11
---

# PostgreSQL Performance & Scaling Engineering Skill

## 1. Purpose & Scope
Optimizing PostgreSQL query execution times, indexing composite multi-tenant access patterns, managing connection pooling limits with serverless workers, and eliminating N+1 query cascades.

## 2. Core Engineering Principles
1. **Compound Multi-Tenant Indexes**: Every query filtering by tenant and child entity must have compound index support: `@@index([schoolId, studentId])`, `@@index([schoolId, createdAt])`, `@@index([schoolId, status])`. Standalone indexes on child columns force PostgreSQL to perform expensive bitmap index scans or full table scans.
2. **Dual Connection Strategy (Pooled vs Direct)**:
   - **Pooled URL (`DATABASE_URL`, port 6543 via PgBouncer)**: Use for all runtime web queries and API transactions to prevent exhausting PostgreSQL connection limits under serverless concurrency.
   - **Direct URL (`DIRECT_URL`, port 5432)**: Use exclusively for DDL operations, migrations (`prisma migrate deploy`), and listen/notify listeners.
3. **Eliminate N+1 Query Cascades**: Avoid looping over an array of entities and issuing individual `SELECT` queries inside each iteration. Use Prisma `include` or batch `findMany({ where: { id: { in: ids } } })`.
4. **Keyset / Cursor-Based Pagination**: For tables with more than 10,000 rows (e.g. `FeePayment`, `AttendanceRecord`, `AuditLog`), avoid high-offset pagination (`OFFSET 50000 LIMIT 50`) which forces PostgreSQL to scan 50,050 rows. Use cursor pagination: `WHERE id > $lastId ORDER BY id ASC LIMIT 50`.
5. **Connection Pool Sizing in Serverless**: Configure Prisma connection pool limits explicitly via query parameters: `?connection_limit=10&pool_timeout=10` to avoid oversubscribing PgBouncer pool slots.

## 3. Recommended Implementation Patterns

### Composite Indexing in Prisma Schema
```prisma
model Student {
  id        String   @id @default(cuid())
  schoolId  String
  campusId  String?
  status    StudentStatus @default(ACTIVE)
  createdAt DateTime @default(now())

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Compound indexes for multi-tenant query performance
  @@index([schoolId, status])
  @@index([schoolId, campusId])
  @@index([schoolId, createdAt(sort: Desc)])
}
```

### Batch Ingestion / Update Pattern
```typescript
// Replace loop with batch update
await prisma.attendanceRecord.createMany({
  data: recordsList,
  skipDuplicates: true,
});
```

## 4. Common Failure Patterns
- **Full Table Scans on Audit Logs**: Querying `FeeAuditLog` without an index on `[schoolId, createdAt]`, causing 10-second latency spikes as table grows.
- **Transaction Starvation**: Long-running background transactions locking rows and blocking interactive HTTP requests.
- **Connection Leak in Serverless**: Creating new PrismaClient instances on every function invocation instead of reusing a global singleton (`globalThis.prisma`).

## 5. Production Readiness Checklist
- [ ] Global Prisma singleton implemented in `apps/web/src/lib/prisma.ts`.
- [ ] All foreign keys and tenant lookups backed by composite indexes.
- [ ] `DIRECT_URL` used for migrations and `DATABASE_URL` (pooled) used for runtime.
- [ ] Large list endpoints enforce `take: 50` or cursor-based pagination.

