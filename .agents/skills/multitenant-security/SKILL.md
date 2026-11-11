---
name: multitenant-security
description: Multi-tenant SaaS data isolation, cross-tenant leakage prevention, tenant context enforcement, and role-based access control
version: 1.0.0
technologies:
  - Multi-Tenant Architecture
  - PostgreSQL Row-Level Isolation
  - RBAC & Tenant Context
sources:
  - https://cheatsheetseries.owasp.org/cheatsheets/Multitenancy_Cheat_Sheet.html
  - https://aws.amazon.com/blogs/apn/multi-tenant-data-isolation-with-postgresql/
verification_date: 2026-11-11
---

# Multi-Tenant SaaS Security Engineering Skill

## 1. Purpose & Scope
Zero-trust multi-tenant isolation protocols for SaaS applications where multiple schools share a unified database and application cluster. Guarantees that no tenant can read, modify, or infer data belonging to another tenant.

## 2. Core Engineering Principles
1. **Never Trust Client-Supplied Tenant IDs**: A user must never be allowed to pass `schoolId` as an unverified query parameter or JSON body property to access tenant records. Always derive `schoolId` strictly from the cryptographically verified session token in the database/Redis cache.
2. **Mandatory Tenant Scoping on All Queries**: Every `SELECT`, `UPDATE`, `DELETE`, and `COUNT` query touching school-specific data MUST include `where: { schoolId }`.
   ```typescript
   // DANGEROUS: IDOR Vulnerability
   await prisma.student.findUnique({ where: { id: studentId } });

   // SECURE: Strict Tenant Scoping
   await prisma.student.findFirst({ where: { id: studentId, schoolId: session.schoolId } });
   ```
3. **Compound Primary/Unique Keys for Child Entities**: Enforce uniqueness scoped to the tenant:
   ```prisma
   @@unique([schoolId, admissionNumber])
   @@unique([schoolId, rollNumber, classId, sectionId])
   ```
4. **Tenant-Aware Cache Keys**: Every Redis cache key, session entry, and rate-limiting bucket must include the tenant identifier as a prefix:
   ```text
   rivo:school:{schoolId}:session:{tokenHash}
   rivo:school:{schoolId}:ratelimit:{ip}
   ```
5. **Storage Isolation**: File storage paths in Azure Blob Storage or S3 must include the tenant prefix in the blob key:
   ```text
   schools/{schoolId}/students/{studentId}/avatar.jpg
   ```
   Users should only receive short-lived SAS tokens scoped to their specific blob path.

## 3. Recommended Implementation Patterns

### Tenant Guard Wrapper for API Handlers
```typescript
export async function withTenantAuth(
  req: NextRequest,
  handler: (ctx: { session: ValidatedSession; schoolId: string; user: AuthUser }) => Promise<NextResponse>
) {
  const session = await resolveValidatedSession(req);
  if (!session || !session.schoolId) {
    return NextResponse.json({ success: false, message: 'Unauthorized or missing school context' }, { status: 401 });
  }
  return handler({ session, schoolId: session.schoolId, user: session.user });
}
```

## 4. Common Failure Patterns
- **Teacher Cross-Class IDOR**: Allowing a teacher assigned to Class 5A to view or edit marks/attendance for Class 10B because the query only checked `schoolId` but omitted `classId` / teacher assignment checks.
- **Export Endpoints Leaking All Tenants**: A background report or CSV download query executing `prisma.feePayment.findMany()` without a `where: { schoolId }` filter, leaking entire database records.
- **Cache Poisoning Across Tenants**: Storing entities by numeric ID without school scoping (`cache.set(`user:${id}`, data)`), allowing tenant collisions.

## 5. Production Readiness Checklist
- [ ] Automated regression tests verify that Tenant A cannot access Tenant B's student IDs (HTTP 404/403).
- [ ] Every Prisma query file audited for unconditional `findUnique` calls on tenant records.
- [ ] Blob storage SAS generator validates `schoolId` path prefix.
- [ ] Redis cache keys enforce `rivo:school:{schoolId}:` namespace.

