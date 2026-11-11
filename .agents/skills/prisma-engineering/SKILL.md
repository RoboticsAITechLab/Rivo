---
name: prisma-engineering
description: Production Prisma ORM 6.x schema modeling, safe schema migrations, singleton client caching, and transactional boundaries
version: 1.0.0
technologies:
  - Prisma ORM 6.19.3
  - TypeScript 5.x
  - PostgreSQL
sources:
  - https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
  - https://www.prisma.io/docs/concepts/components/prisma-migrate
  - https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/instantiate-prisma-client
verification_date: 2026-11-11
---

# Prisma ORM Engineering Skill

## 1. Purpose & Scope
Best practices for Prisma ORM 6.x in high-scale Next.js environments, ensuring zero connection leaks, safe schema migrations without data loss, and atomic transactional boundaries.

## 2. Core Engineering Principles
1. **Global Singleton in Next.js**: Next.js hot-reloads modules in development and boots multiple lambdas in production. Recreating `PrismaClient` on every import exhausts database connection pools in seconds. Always use the global singleton pattern:
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

   export const prisma =
     globalForPrisma.prisma ??
     new PrismaClient({
       log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
     });

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```
2. **Never Run `prisma db push` in Production**: `db push` can silently drop columns or recreate constraints without tracking. Always run `prisma migrate deploy` in CI/CD pipelines against a direct database connection (`DIRECT_URL`).
3. **Strict Cascades & Soft Deletion**: Use `onDelete: Cascade` only for strict ownership hierarchies (e.g. `School` -> `Campus` -> `Class`). Never cascade-delete financial transactions, receipts, or audit logs. Use status flags (`ARCHIVED`, `INACTIVE`) for entities with historical records.
4. **Prisma Schema Validation in CI**: Run `prisma validate` on every pull request to catch syntax errors, missing opposite relation fields, and invalid enum definitions before deployment.
5. **Interactive Transaction Timeouts**: In serverless functions, configure explicit transaction timeouts (`timeout: 10000`, `maxWait: 5000`) so slow queries fail quickly rather than hanging lambdas.

## 3. Recommended Implementation Patterns

### Safe Transaction Helper
```typescript
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { isolationLevel?: Prisma.TransactionIsolationLevel; timeout?: number } = {}
): Promise<T> {
  return prisma.$transaction(fn, {
    isolationLevel: options.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
    timeout: options.timeout ?? 10000,
  });
}
```

## 4. Production Readiness Checklist
- [ ] `prisma validate` passes cleanly with zero warnings.
- [ ] No migrations contain destructive unreviewed `DROP TABLE` statements.
- [ ] Client singleton configured with connection pooling.
- [ ] Prisma engine binary targets specified appropriately (`native`, `rhel-openssl-3.0.x` for Vercel/Linux).

