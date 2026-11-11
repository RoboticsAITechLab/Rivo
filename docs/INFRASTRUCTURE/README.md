# RIVO — Cloud Infrastructure & DevOps

> **Last Verified:** November 11, 2026  
> **Target Cloud Platforms:** Vercel (Edge Serverless), Neon (PostgreSQL), Upstash (Redis), Azure (Blob Storage), Resend (Email)  
> **Status:** Production Ground Truth

---

## 1. Cloud Architecture Topology

Rivo is deployed as a multi-tier cloud application:
1. **Frontend & Serverless API:** Hosted on **Vercel** (`rivo-web`, Project ID: `prj_hrbetI4cKIzSeHdeyJcoafGHvvtc`). All routes in `apps/web/src/app` execute on Vercel's Edge/Serverless platform.
2. **Relational Database:** Hosted on **Neon Serverless PostgreSQL**. Leverages Neon's built-in PgBouncer connection pooler on port 6543 (`DATABASE_URL`) for runtime requests, and a direct connection on port 5432 (`DIRECT_URL`) for schema migrations.
3. **Distributed In-Memory Datastore:** Hosted on **Upstash Redis** for distributed sliding-window rate limiting and session caching.
4. **Cloud Object Storage:** Hosted on **Azure Blob Storage** (`rivo-public` for crests/branding, `rivo-private` for KYC documents and avatars). Direct client browser uploads utilize 15-minute write-only SAS tokens.
5. **Transactional Email:** Powered by the **Resend API** for staff onboarding invitations and password recovery tokens.

---

## 2. Infrastructure Documentation Map

- [ENVIRONMENT_VARIABLES.md](file:///d:/Rivo/docs/INFRASTRUCTURE/ENVIRONMENT_VARIABLES.md) — Sanitized reference table of all environment variables with placeholders.
- [DEPLOYMENT.md](file:///d:/Rivo/docs/INFRASTRUCTURE/DEPLOYMENT.md) — Production deployment runbook, pre-flight checks, and rollback procedures.
- [STORAGE_AND_INTEGRATIONS.md](file:///d:/Rivo/docs/INFRASTRUCTURE/STORAGE_AND_INTEGRATIONS.md) — Azure Blob direct SAS uploads, Upstash Redis fail-closed, and Resend.
- [DEVELOPMENT_SETUP.md](file:///d:/Rivo/docs/INFRASTRUCTURE/DEVELOPMENT_SETUP.md) — Step-by-step local installation and database seed runbook.

