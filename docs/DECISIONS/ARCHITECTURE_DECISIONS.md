# Architectural Decision Records (ADRs) Catalog

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Architectural Decisions

---

## ADR-001: Collocation of Frontend UI & API Handlers in Next.js Full-Stack Monolith

- **Decision ID:** `ADR-001`
- **Title:** Next.js 16 Full-Stack App Router Monolith over Standalone NestJS Microservice
- **Status:** `VERIFIED`
- **Context:** An early architectural phase explored running a standalone NestJS backend (`apps/api`) separate from the Next.js frontend (`apps/web`). However, maintaining dual configurations, duplicated Prisma clients, and cross-service HTTP hops introduced overhead during rapid MVP iteration.
- **Decision:** Consolidate all authoritative production REST API routes, domain services, authentication guards, and database access directly into `apps/web/src/app/api` and `apps/web/src/lib`. Maintain `apps/api` purely as an experimental/scaffolded prototype.
- **Reasoning:**
  - Collocates server-side Route Handlers with React Server Components, eliminating network hops for internal data fetching.
  - Simplifies local development setup to a single command (`npm run dev`).
  - Maximizes compatibility with Vercel Serverless Edge deployment.
- **Consequences:**
  - *Positive:* Faster feature delivery, single deployment pipeline, zero cross-origin configuration friction.
  - *Trade-off:* `apps/api` remains an unmaintained prototype with duplicate dependencies that must be documented clearly to avoid developer confusion.
- **Relevant Files:** `apps/web/src/app/api/*`, `apps/web/src/lib/*`, `apps/api/README.md`.

---

## ADR-002: Relational Custom Roles and Permissions over JSON Settings Blobs

- **Decision ID:** `ADR-002`
- **Title:** Relational `CustomRole` and `RolePermission` Tables over JSON Blobs in `SchoolSetting`
- **Status:** `VERIFIED`
- **Context:** An earlier iteration attempted to store custom administrative roles as an untyped JSON array inside `SchoolSetting` (`category: 'roles'`). However, this prevented foreign key constraints from linking `SchoolMembership` or `StaffInvitation` to custom roles, causing newly invited staff to silently degrade to default `Role.TEACHER`.
- **Decision:** Migrate role definitions to first-class relational PostgreSQL models: `CustomRole`, `RolePermission`, and `UserPermissionOverride`. Implement automatic backfill logic in `roleService.migrateLegacySettingsRoles`.
- **Reasoning:** Guarantees relational referential integrity, prevents invalid role assignments, enables database cascading checks, and supports high-speed SQL joins.
- **Consequences:**
  - *Positive:* Zero silent role degradation, auditable permission grants, strong type safety.
  - *Trade-off:* Requires relational schema migrations when adding new base permission scopes.
- **Relevant Files:** `prisma/schema.prisma:140-185`, `apps/web/src/lib/roles/role-service.ts`, `docs/audits/INVITATION_ACCESS_REMEDIATION_REPORT.md`.

---

## ADR-003: Immutable Versioned Fee Plans with Transactional Reversals

- **Decision ID:** `ADR-003`
- **Title:** Version-Locked Fee Plans and Non-Destructive Payment Reversals
- **Status:** `VERIFIED`
- **Context:** School financial auditing requires historical accuracy. If an administrator alters a fee plan or deletes a payment mid-year, previous installments, obligations, and receipts lose their mathematical and legal validity.
- **Decision:**
  1. Once a fee plan version is published (`FeePlanVersionStatus.PUBLISHED`), it is permanently locked against modification. Structural modifications require branching a new draft version (`v2`), preserving `v1` intact.
  2. Payments and concessions can never be deleted from PostgreSQL. Erroneous entries are transactionally marked as `REVERSED` with a cancellation reason, restoring original obligation balances and emitting an immutable `FeeAuditLog` record.
- **Reasoning:** Satisfies institutional accounting standards, provides mathematical proof of all financial adjustments, and eliminates silent financial discrepancies.
- **Consequences:**
  - *Positive:* Legal compliance, dispute-free reconciliation, audit transparency.
  - *Trade-off:* Slightly increased database row volume due to keeping reversed transactions.
- **Relevant Files:** `apps/web/src/lib/fees/fee-plan-service.ts`, `apps/web/src/lib/fees/fee-payment-service.ts`, `prisma/schema.prisma:415-530`.

---

## ADR-004: Direct-to-Cloud Browser SAS Uploads for Azure Blob Storage

- **Decision ID:** `ADR-004`
- **Title:** Client-Direct Azure Blob SAS Uploads over Server-Proxied Multi-Part Uploads
- **Status:** `VERIFIED`
- **Context:** Uploading large identity documents, student portraits, and certificates through Vercel serverless functions risks execution timeouts (10-15s limit), serverless memory exhaustion, and payload size limitations (4.5 MB body limit on Vercel).
- **Decision:** Use a two-step direct-to-cloud upload workflow. The browser requests a write-only, short-lived (15 minutes / 900s) Shared Access Signature (`cw` permissions) via `POST /api/media/sas/upload`, and then performs an HTTP `PUT` directly to Azure Blob Storage.
- **Reasoning:**
  - Bypasses Vercel serverless execution memory and timeout limits.
  - Validates file quotas (2MB avatar, 3MB logo, 10MB doc) and magic-byte signatures on the server before generating the token.
  - Enforces deterministic tenant-isolated blob keys (`schools/{schoolId}/{category}/{entityId}/{hash}.ext`).
- **Consequences:**
  - *Positive:* High-speed direct uploads, zero Vercel bandwidth consumption, resilient handling of large documents.
  - *Trade-off:* Requires Azure CORS rules allowing `PUT` requests from `*.rivo.school` and `localhost:3000`.
- **Relevant Files:** `apps/web/src/lib/storage/azure-blob.ts`, `apps/web/src/lib/storage/validation.ts`, `apps/web/src/app/api/media/sas/upload/route.ts`.

---

## ADR-005: State Machine Status Enumerations over Soft-Delete Timestamps

- **Decision ID:** `ADR-005`
- **Title:** Explicit State Machine Enumerations over Generic `deletedAt` Soft Deletes
- **Status:** `VERIFIED`
- **Context:** Generic soft deletion via `deletedAt DateTime?` timestamps on every table creates significant performance and constraint hazards in PostgreSQL: compound unique constraints (such as `[schoolId, admissionNumber]`) fail unless complex partial indexes are maintained, and every single query must append `where: { deletedAt: null }`.
- **Decision:** Do not use `deletedAt` timestamps. Instead, use explicit domain state machine enumerations:
  - `SchoolStatus`: `ACTIVE`, `TRIAL`, `SUSPENDED`, `ARCHIVED`
  - `StudentStatus`: `ACTIVE`, `INACTIVE`, `GRADUATED`, `SUSPENDED`, `TRANSFERRED`
  - `TeacherStatus`: `ACTIVE`, `ON_LEAVE`, `INACTIVE`, `TERMINATED`
  - `FeeObligationStatus`: `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `WAIVED`, `CANCELLED`
  - `FeePaymentStatus`: `COLLECTED`, `REVERSED`
- **Reasoning:**
  - Accurately captures educational and financial reality (a transferred student is fundamentally different from a deleted record).
  - Eliminates accidental data leaks from omitting `deletedAt IS NULL` filters.
  - Allows standard PostgreSQL compound unique constraints to operate cleanly.
- **Consequences:**
  - *Positive:* Clean queries, semantic domain status modeling, standard unique index behavior.
  - *Trade-off:* UI filters must explicitly account for multiple non-active statuses when displaying rosters.
- **Relevant Files:** `prisma/schema.prisma` (Enums: `SchoolStatus`, `StudentStatus`, `TeacherStatus`, `FeePaymentStatus`, `FeeObligationStatus`).

