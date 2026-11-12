# RIVO — Architectural & Product Decision Log (ADR)

> **Document:** `DECISION_LOG.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO, Chief Product Officer & Principal Architect | **Version:** 1.0.0-EXEC  

---

## 1. Decision Records Summary

| Decision ID | Title | Scope | Status | Date |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | Retain Next.js 16 App Router Monolith over NestJS Extraction | Backend Architecture | **APPROVED** | 2026-11-11 |
| **ADR-002** | Shared Database, Shared Schema with Row-Level Tenant Isolation | Database Architecture | **APPROVED** | 2026-11-11 |
| **ADR-003** | Teacher Academic Experience Delivered as PWA Web-First | Mobile / Frontend | **APPROVED** | 2026-11-11 |
| **ADR-004** | Dual-Tier Student Segmentation (K-8 Parent Mode / 9-12 Web Portal)| Product Strategy | **APPROVED** | 2026-11-11 |
| **ADR-005** | Pessimistic `FOR UPDATE` Concurrency Locks on Financial Ledgers | Data Integrity | **APPROVED** | 2026-11-11 |
| **ADR-006** | 3-Tier Cascading Communication Strategy (In-App/Push, WhatsApp, SMS)| Infrastructure | **APPROVED** | 2026-11-11 |

---

## 2. Detailed Architectural Decision Records

### ADR-001: Retain Next.js 16 App Router Modular Monolith over NestJS Microservices
- **Context:** An inactive NestJS scaffold exists in `apps/api`. A previous hypothesis considered migrating production route handlers from `apps/web` to `apps/api`.
- **Options Considered:**
  1. Option A: Migrate to NestJS standalone microservice.
  2. Option B: Retain Next.js 16 App Router full-stack monolith co-located with PostgreSQL.
- **Decision:** **Option B.** Retain Next.js 16 full-stack monolith.
- **Reasoning:** Co-locating API routes and UI components provides sub-20ms query latency, atomic single-transaction database operations across modules, and cuts infrastructure hosting costs by half. `apps/api` remains an isolated prototype.
- **Impact:** All API route handlers reside in `apps/web/src/app/api/*`.

### ADR-002: Shared Database, Shared Schema with Row-Level Tenant Isolation
- **Context:** Multi-tenant architecture options: Database-per-tenant vs Schema-per-tenant vs Shared Schema with Row-Level Isolation.
- **Decision:** **Shared Schema with Row-Level Isolation.** Every table enforces `schoolId String`.
- **Reasoning:** Database-per-tenant for 100+ schools introduces catastrophic migration maintenance, connection pool starvation, and $1,900+/mo cloud costs vs $89/mo for pooled Neon serverless PostgreSQL.
- **Impact:** Mandatory rule: Every query MUST enforce `where: { schoolId }`.

### ADR-003: Teacher Academic Experience Delivered as PWA Web-First
- **Context:** Whether to develop a dedicated native Flutter Teacher App or a responsive web PWA.
- **Decision:** **Responsive Web PWA inside `apps/web/(teacher)`.**
- **Reasoning:** Saves 35+ engineering days and avoids maintaining three native codebases. Offline IndexedDB draft attendance and marks locking provide required classroom resilience without app store review delays.
- **Impact:** Teacher portal lives in `apps/web/src/app/(teacher)`. Flutter Teacher app deferred to post-launch.

### ADR-004: Dual-Tier Student Segmentation (K-8 Parent Mode / 9-12 Web Portal)
- **Context:** How to deliver student academic access in compliance with the Indian DPDP Act 2023.
- **Decision:** Primary students (K-8) access resources via "Student Mode" in Parent Mobile App; Secondary students (9-12) access a responsive web portal at `/student`.
- **Reasoning:** Section 9 of the DPDP Act 2023 restricts autonomous processing of minor children's data without verifiable parental consent. Dedicated student mobile app is deferred.

### ADR-005: Pessimistic `FOR UPDATE` Concurrency Locks on Financial Ledgers
- **Context:** Potential race conditions during simultaneous payment submissions against the same fee obligation.
- **Decision:** Obligation balances and sequence numbers MUST be queried and incremented using `SELECT ... FOR UPDATE` inside `prisma.$transaction`.
- **Reasoning:** In-memory calculations in Node.js or mobile clients permit double allocations and overpayments. The PostgreSQL database is the sole authoritative source of truth.

### ADR-006: Three-Tier Cascading Communication Strategy
- **Context:** Managing communication costs across SMS, WhatsApp, and Push notifications.
- **Decision:** Tier 1 (Free In-App & Firebase FCM Push) -> Tier 2 (Meta WhatsApp Cloud API for urgent fees/absences) -> Tier 3 (Transactional SMS fallback for OTPs only).
- **Reasoning:** SMS is cost-prohibitive for routine notices. WhatsApp provides high engagement at reasonable unit cost. Free push notifications serve as the default high-frequency channel.
