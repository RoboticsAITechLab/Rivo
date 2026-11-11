# RIVO — Master Documentation & Knowledge System

Welcome to the central technical documentation and project knowledge system for the **RIVO School Management SaaS** repository.

This directory contains the complete, code-verified technical documentation, architecture specifications, API references, database catalogs, infrastructure runbooks, and project management roadmaps.

---

## 🚀 Instant AI Context Recovery & Handoff

If you are an AI coding assistant or a software engineer resuming work on Rivo:

```text
"Resume Rivo development. First read AGENTS.md, docs/README.md, docs/PROJECT_CONTEXT.md,
docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md, and docs/PROJECT_MANAGEMENT/NEXT_STEPS.md.
Then inspect Git status and recent changes. Validate the relevant documentation against
current source code before starting implementation."
```

- **Master System Truth:** [`docs/PROJECT_CONTEXT.md`](file:///d:/Rivo/docs/PROJECT_CONTEXT.md) *(Highest Priority — Read this first)*
- **AI Agent Operating Rules:** [`AGENTS.md`](file:///d:/Rivo/AGENTS.md)
- **Feature Matrix:** [`docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md)
- **Active Task Roadmap:** [`docs/PROJECT_MANAGEMENT/NEXT_STEPS.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/NEXT_STEPS.md)

---

## 📚 Central Documentation Sitemap

### 1. System Truth & Architecture Core
- [PROJECT_CONTEXT.md](file:///d:/Rivo/docs/PROJECT_CONTEXT.md) — The permanent project handoff file, technical stack, and system invariants.
- [PROJECT_OVERVIEW.md](file:///d:/Rivo/docs/PROJECT_OVERVIEW.md) — What Rivo is, product vision, user personas, and commercial model.
- [PRODUCT_SPECIFICATION.md](file:///d:/Rivo/docs/PRODUCT_SPECIFICATION.md) — Feature requirements, functional specs, and business workflows.
- [REQUIREMENTS.md](file:///d:/Rivo/docs/REQUIREMENTS.md) — Functional and non-functional engineering requirements.
- [ARCHITECTURE.md](file:///d:/Rivo/docs/ARCHITECTURE.md) — High-level system architecture, application boundaries, and runtime topologies.
- [REPOSITORY_STRUCTURE.md](file:///d:/Rivo/docs/REPOSITORY_STRUCTURE.md) — Directory map, monorepo workspaces, entry points, and dependency graph.
- [SYSTEM_DATA_FLOW.md](file:///d:/Rivo/docs/SYSTEM_DATA_FLOW.md) — End-to-end data lifecycle: Browser ➔ Edge ➔ API ➔ Service ➔ Database.

### 2. Frontend Engineering (`docs/FRONTEND/`)
- [FRONTEND/README.md](file:///d:/Rivo/docs/FRONTEND/README.md) — Frontend overview (Next.js 16, React 19, Tailwind v4).
- [FRONTEND/APPLICATION_STRUCTURE.md](file:///d:/Rivo/docs/FRONTEND/APPLICATION_STRUCTURE.md) — Directory organization of `apps/web/src`.
- [FRONTEND/ROUTES_AND_PAGES.md](file:///d:/Rivo/docs/FRONTEND/ROUTES_AND_PAGES.md) — Exhaustive inventory of all 67 App Router pages and layouts.
- [FRONTEND/COMPONENTS.md](file:///d:/Rivo/docs/FRONTEND/COMPONENTS.md) — Headless UI primitives, layouts, forms, and dialog sheets.
- [FRONTEND/STATE_MANAGEMENT.md](file:///d:/Rivo/docs/FRONTEND/STATE_MANAGEMENT.md) — Contexts, stores, hooks, URL state, and cache invalidation.
- [FRONTEND/UI_DESIGN_SYSTEM.md](file:///d:/Rivo/docs/FRONTEND/UI_DESIGN_SYSTEM.md) — Design tokens, Tailwind v4 theme, Lucide icons, and Motion guidelines.

### 3. Backend Engineering (`docs/BACKEND/`)
- [BACKEND/README.md](file:///d:/Rivo/docs/BACKEND/README.md) — Backend architecture overview.
- [BACKEND/MODULES.md](file:///d:/Rivo/docs/BACKEND/MODULES.md) — Domain module breakdowns (`apps/web/src/lib/*`).
- [BACKEND/API_REFERENCE.md](file:///d:/Rivo/docs/BACKEND/API_REFERENCE.md) — Complete inventory of 74+ production API route handlers.
- [BACKEND/AUTHENTICATION.md](file:///d:/Rivo/docs/BACKEND/AUTHENTICATION.md) — Sessions, Scrypt hashing, TOTP MFA, OTP auth, and RBAC hierarchy.
- [BACKEND/BUSINESS_LOGIC.md](file:///d:/Rivo/docs/BACKEND/BUSINESS_LOGIC.md) — Core business engines (fee ledger, roll allocation, clash validation).
- [BACKEND/VALIDATION_AND_ERRORS.md](file:///d:/Rivo/docs/BACKEND/VALIDATION_AND_ERRORS.md) — Input validation, standard response envelopes, and error codes.

### 4. Database & Data Architecture (`docs/DATABASE/`)
- [DATABASE/README.md](file:///d:/Rivo/docs/DATABASE/README.md) — Database overview and Prisma configuration.
- [DATABASE/DATABASE_SCHEMA.md](file:///d:/Rivo/docs/DATABASE/DATABASE_SCHEMA.md) — Complete reference of all 67 models and 30 enums.
- [DATABASE/ENTITY_RELATIONSHIPS.md](file:///d:/Rivo/docs/DATABASE/ENTITY_RELATIONSHIPS.md) — Mermaid ER diagrams, cascades, and restrict constraints.
- [DATABASE/MIGRATIONS.md](file:///d:/Rivo/docs/DATABASE/MIGRATIONS.md) — Chronological history of all 14 database migrations.

### 5. Infrastructure & DevOps (`docs/INFRASTRUCTURE/`)
- [INFRASTRUCTURE/README.md](file:///d:/Rivo/docs/INFRASTRUCTURE/README.md) — Cloud topology (Vercel, Neon, Redis, Azure, Resend).
- [INFRASTRUCTURE/ENVIRONMENT_VARIABLES.md](file:///d:/Rivo/docs/INFRASTRUCTURE/ENVIRONMENT_VARIABLES.md) — Sanitized reference table for all environment variables.
- [INFRASTRUCTURE/DEPLOYMENT.md](file:///d:/Rivo/docs/INFRASTRUCTURE/DEPLOYMENT.md) — Production deployment procedures and Vercel pipeline.
- [INFRASTRUCTURE/STORAGE_AND_INTEGRATIONS.md](file:///d:/Rivo/docs/INFRASTRUCTURE/STORAGE_AND_INTEGRATIONS.md) — Azure Blob SAS uploads, Resend emails, and Neon pooling.
- [INFRASTRUCTURE/DEVELOPMENT_SETUP.md](file:///d:/Rivo/docs/INFRASTRUCTURE/DEVELOPMENT_SETUP.md) — Local installation, database setup, and seed runbook.

### 6. Security & Quality Review (`docs/SECURITY/`)
- [SECURITY/README.md](file:///d:/Rivo/docs/SECURITY/README.md) — Security policy and threat model.
- [SECURITY/SECURITY_REVIEW.md](file:///d:/Rivo/docs/SECURITY/SECURITY_REVIEW.md) — Code-first security audit report (12 prioritized findings).

### 7. Development & QA Guide (`docs/DEVELOPMENT/`)
- [DEVELOPMENT/README.md](file:///d:/Rivo/docs/DEVELOPMENT/README.md) — Developer guide overview.
- [DEVELOPMENT/COMMANDS.md](file:///d:/Rivo/docs/DEVELOPMENT/COMMANDS.md) — Verified package scripts and CLI tools.
- [DEVELOPMENT/TESTING.md](file:///d:/Rivo/docs/DEVELOPMENT/TESTING.md) — Running integration test suites and in-app Testing Center.
- [DEVELOPMENT/DEBUGGING.md](file:///d:/Rivo/docs/DEVELOPMENT/DEBUGGING.md) — Troubleshooting common errors, locks, and connectivity issues.
- [DEVELOPMENT/CODING_CONVENTIONS.md](file:///d:/Rivo/docs/DEVELOPMENT/CODING_CONVENTIONS.md) — Multi-tenant isolation rules, transaction patterns, and formatting.

### 8. Project Management & Roadmaps (`docs/PROJECT_MANAGEMENT/`)
- [PROJECT_MANAGEMENT/FEATURE_STATUS.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md) — Ground-truth feature completeness matrix.
- [PROJECT_MANAGEMENT/IMPLEMENTATION_ROADMAP.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/IMPLEMENTATION_ROADMAP.md) — Short, medium, and long-term release milestones.
- [PROJECT_MANAGEMENT/KNOWN_ISSUES.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/KNOWN_ISSUES.md) — Cataloged operational defects and edge-case limitations.
- [PROJECT_MANAGEMENT/TECHNICAL_DEBT.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/TECHNICAL_DEBT.md) — Architectural debt items and refactoring backlog.
- [PROJECT_MANAGEMENT/NEXT_STEPS.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/NEXT_STEPS.md) — Actionable prioritized tasks for the next development sprint.

### 9. Architecture Decisions (`docs/DECISIONS/`)
- [DECISIONS/README.md](file:///d:/Rivo/docs/DECISIONS/README.md) — Architectural decision record (ADR) protocol.
- [DECISIONS/ARCHITECTURE_DECISIONS.md](file:///d:/Rivo/docs/DECISIONS/ARCHITECTURE_DECISIONS.md) — Formally recorded ADRs (Monolith, Roles, Fees, Storage, etc.).

---

## 🗄️ Historical Documentation Archive

The repository retains earlier documentation written during previous development phases. These documents provide valuable historical context on product requirements, but should be cross-referenced with code as technical claims may be outdated:
- `docs/administration/` — Legacy administrative feature guides.
- `docs/audits/` — Historical implementation audits (Fee Management, Staff Enrollment, Settings).
- `docs/developer/` — Legacy developer guides (references Next.js 14 and early Zustand patterns).
- `docs/getting-started/` — Initial walkthroughs.
- `docs/workflows/` — Detailed procedural business workflows.
