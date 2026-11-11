# RIVO — Backend Architecture

> **Last Verified:** November 11, 2026  
> **Primary Backend Implementation:** `apps/web/src/app/api` & `apps/web/src/lib`  
> **Status:** Production Ground Truth

---

## 1. Architectural Reality

1. **Active Production Backend:** 100% of the active backend services, business logic, authentication guards, and REST endpoints are hosted inside **`apps/web`** as **Next.js 16 App Router Route Handlers (`src/app/api/*`)**.
2. **`apps/api` (NestJS) Status:** `apps/api` is an early prototype scaffold containing only boilerplate, a `PrismaService`, and a health controller (`GET /api/v1/health`). It is **not deployed to production** and serves no client traffic.
3. **Data Layer:** Backed by **Prisma ORM 6.19.3** querying **Neon Serverless PostgreSQL** with **Upstash Redis** for session caching and rate limiting.

---

## 2. Core Architectural Pillars

- **Application-Level Multi-Tenancy:** Rigid tenant isolation enforced by `auth.schoolId` scoping in all Prisma queries and compound unique constraints in the schema.
- **Role & Resource-Based Authorization:** Deterministic 7-stage permission precedence evaluating hierarchical roles (`DIRECTOR`, `PRINCIPAL`, `TEACHER`, etc.) and granular resource scopes (`SCHOOL`, `CAMPUS`, `ASSIGNED`, `OWN`).
- **Cryptographic Security:** Scrypt password hashing, SHA-256 session token hashing, AES-256-GCM field-level encryption for sensitive KYC data, and RFC 6238 TOTP MFA.
- **Financial Ledger Integrity:** Immutable versioned fee plans, strict non-overpayment rules, transactional double-entry payment allocations, and serverless vector PDF receipt generation via `pdf-lib`.

---

## 3. Backend Documentation Map

- [MODULES.md](file:///d:/Rivo/docs/BACKEND/MODULES.md) — Comprehensive breakdown of domain services in `apps/web/src/lib/*`.
- [API_REFERENCE.md](file:///d:/Rivo/docs/BACKEND/API_REFERENCE.md) — Exhaustive catalog of all 74+ production API route handlers.
- [AUTHENTICATION.md](file:///d:/Rivo/docs/BACKEND/AUTHENTICATION.md) — Sessions, Scrypt crypto, TOTP MFA, OTP auth, and role evaluation.
- [BUSINESS_LOGIC.md](file:///d:/Rivo/docs/BACKEND/BUSINESS_LOGIC.md) — Core business engines (fee ledger, roll balancing, clash validation).
- [VALIDATION_AND_ERRORS.md](file:///d:/Rivo/docs/BACKEND/VALIDATION_AND_ERRORS.md) — Request validation patterns, standardized envelopes, and HTTP error codes.

