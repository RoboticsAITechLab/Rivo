# AGENTS.md — RIVO Engineering & AI Agent Operating System

Welcome to the **RIVO** codebase. This document defines the operational rules, architectural boundaries, coding conventions, and context restoration protocols for all AI coding agents and human engineers working on this repository.

---

## 1. Quick Context Restoration (Start Here)

If you are an AI coding agent or engineer resuming work on Rivo:

```bash
# Context restoration prompt sequence:
"Resume Rivo development. First read AGENTS.md, docs/README.md, docs/PROJECT_CONTEXT.md,
docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md, and docs/PROJECT_MANAGEMENT/NEXT_STEPS.md.
Then inspect Git status and recent changes. Validate the relevant documentation against
current source code before starting implementation."
```

### Essential Reading Order
1. **[AGENTS.md](file:///d:/Rivo/AGENTS.md)**: Operating rules and guardrails (this document).
2. **[docs/PROJECT_CONTEXT.md](file:///d:/Rivo/docs/PROJECT_CONTEXT.md)**: Permanent master architectural and product handoff file.
3. **[docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md)**: Ground truth feature matrix across UI, API, Service, and DB.
4. **[docs/PROJECT_MANAGEMENT/NEXT_STEPS.md](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/NEXT_STEPS.md)**: Prioritized immediate development roadmap.
5. Domain-specific docs in `docs/FRONTEND/`, `docs/BACKEND/`, `docs/DATABASE/`, `docs/INFRASTRUCTURE/`, and `docs/SECURITY/` as required for your specific task.

---

## 2. Core Architecture Rules & Ground Truth

### 2.1 The Authoritative Production App is `apps/web`
- **Full-Stack Monolith:** `apps/web` is a Next.js 16.3.5 (App Router) application that houses **both** the frontend client interfaces (`/(school)`, `/(teacher)`, `/(parent)`, `/(auth)`, `/testing-center`) **and** the complete production backend API (`/api/*`).
- **Prisma Data Layer:** `apps/web/src/lib/prisma.ts` connects directly to Neon PostgreSQL.
- **`apps/api` (NestJS) is a Prototype:** `apps/api` contains only a health check endpoint and is **not deployed to production** or connected to customer traffic. Do not write business logic in `apps/api` unless explicitly assigned to a standalone microservice extraction task.
- **`apps/parent` (Flutter) is the Mobile Client:** Consumes Next.js API endpoints (`/api/auth/parent/*`, `/api/notices`, etc.) hosted in `apps/web`.
- **`packages/*` are Workspace Placeholders:** `packages/config`, `packages/types`, and `packages/validation` are reserved monorepo placeholders. Active types reside in `apps/web/src/types` and feature types; active validation resides in `apps/web/src/lib/validation` and feature validation files.

### 2.2 Product Scope Boundaries
- **Current MVP Priority:** **School / Admin Management Side (`/(school)/school/*`)**.
- **Parent & Student Experiences:** Frozen for current phase. Do not initiate unsolicited redesigns or feature additions for parent/student portals until the school management administration product is launched and stable.
- **Communication Strategy:** WhatsApp-first approach. In-app notifications and email (Resend) are baseline low-cost channels. SMS is a limited fallback for OTPs.

---

## 3. Strict Development & Safety Guidelines

### 3.1 Code Modification Rules
1. **Inspect Before Changing:** Always read the target file and its callers before writing code. Verify existing behavior against tests.
2. **Never Touch Unrelated Code:** Strictly confine your changes to the files necessary for the user's specific request. Never refactor surrounding architecture unless explicitly asked.
3. **No Secret Leaks:** Never commit or hardcode actual credentials, tokens, or connection strings. Use sanitized environment variable lookups (`process.env.VAR_NAME`).
4. **Multi-Tenant Isolation:** Every database query touching tenant data **must** enforce `where: { schoolId }` or use the validated `session.schoolId`. Cross-tenant data leakage is a critical P0 failure.
5. **Atomic Transactions:** All financial operations (fee payments, reversals, concessions, plan publishing) and complex entity creation (student intake, faculty onboarding, roll rebalancing) **must** run inside `prisma.$transaction(async (tx) => ...)`.

### 3.2 Coding Conventions
- **Language & Runtime:** TypeScript (Strict), Next.js 16 App Router, React 19 Client/Server components.
- **Styling:** Tailwind CSS v4 (configured via `@tailwindcss/postcss` and `@import "tailwindcss"` in `globals.css`). Do not create or expect a `tailwind.config.ts`.
- **UI Primitives:** Custom headless primitives in `apps/web/src/components/ui/` (`Button`, `Card`, `Dialog`, `Sheet`, `Badge`, `Input`, `Tabs`).
- **Motion:** Use the `motion` package (`import { motion, AnimatePresence } from 'motion/react'`). Honor `prefers-reduced-motion`.
- **Toasts:** Use `sonner` (`import { toast } from 'sonner'`). Ensure `<Toaster />` is mounted in layout.
- **Icons:** `lucide-react`.

---

## 4. Key Development & Verification Commands

All commands run from the repository root:

```bash
# Install dependencies
npm ci

# Validate Prisma schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate

# Deploy database migrations (uses direct connection for DDL)
npm run prisma:migrate:deploy

# Run local development server (boots apps/web on port 3000)
npm run dev

# Run production build (apps/web)
npm run build

# Run unit and integration tests (Requires reachable PostgreSQL)
npm run test:auth          # 87-point RBAC and authentication validation
npm run test:id            # Multi-tenant atomic ID generator
npm run test:fee           # Fee management, obligations, installments
npm run test:academic      # Teacher, timetable, exam conflicts
npm run test:parent        # Parent OTP and MFA
npm run test:media         # Azure Blob SAS and file validation
npm run test:remediation   # Environment fail-closed & security hardening
npm run test:observability # Testing Center telemetry & sanitation
npm run test               # Run all test suites
```

---

## 5. Documentation Maintenance Protocol

Whenever you implement a feature, fix a bug, or change architectural behavior:
1. Update `docs/PROJECT_MANAGEMENT/FEATURE_STATUS.md` to reflect the current status (`IMPLEMENTED`, `PARTIALLY_IMPLEMENTED`, etc.).
2. Update `docs/PROJECT_MANAGEMENT/NEXT_STEPS.md` to mark completed tasks and re-prioritize.
3. If an architectural decision or database schema changed, record an entry in `docs/DECISIONS/ARCHITECTURE_DECISIONS.md`.
4. Keep `docs/PROJECT_CONTEXT.md` up-to-date with any changes to high-level architecture or environment configuration.

