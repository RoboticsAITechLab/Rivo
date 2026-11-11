# RIVO — Repository Structure & Directory Map

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Ground Truth  
> **Repository Root:** `d:/Rivo`

---

## 1. Monorepo Organization

Rivo is structured as an **npm Workspaces** monorepo declared in `package.json`:

```json
"workspaces": [
  "apps/web",
  "apps/api",
  "packages/*"
]
```

---

## 2. Exhaustive Directory Breakdown

### 2.1 Monorepo Root
| Path | Description |
| :--- | :--- |
| `AGENTS.md` | Core operating system and rules for AI coding agents |
| `package.json` | Root scripts, Prisma seed definition, monorepo workspaces |
| `package-lock.json` | Lockfile v3 for deterministic npm installations |
| `.gitignore` | Ignores `node_modules`, `.next`, `dist`, `.env*` (except examples) |
| `.vercel/project.json` | Vercel production linkage (`rivo-web`, `prj_hrbetI4cKIzSeHdeyJcoafGHvvtc`) |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline (Node 20, Lint, 9 Test Suites, Build) |
| `.agents/skills/` | Project skills for agents: `neon`, `neon-postgres`, `rivo-ui-motion` |
| `infrastructure/` | Runbooks, deployment guides, Redis and storage specifications |
| `prisma/` | Master database schema, migrations, seed script |
| `docs/` | Centralized technical documentation & knowledge system |

---

### 2.2 `apps/web` (The Authoritative Production Monolith)
```
apps/web/
├── next.config.ts                # Next.js 16 configuration
├── package.json                  # Dependencies (Next 16, React 19, Tailwind 4, Motion 14, Prisma)
├── tsconfig.json                 # Path aliases (@/* -> ./src/*)
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss
└── src/
    ├── middleware.ts             # Edge guard (cookie verification, security headers)
    ├── app/                      # Next.js App Router (67 pages & layouts)
    │   ├── (auth)/               # Login, signup, forgot-password, reset-password, invite
    │   ├── (school)/school/      # Main School Admin OS workspace
    │   ├── (teacher)/teacher/    # Faculty portal workspace
    │   ├── (parent)/parent/      # Parent portal workspace
    │   ├── access-denied/        # 403 Forbidden boundary fallback page
    │   ├── admin/                # Platform admin (redirects to /testing-center)
    │   ├── testing-center/       # Diagnostic & live observability workbench
    │   ├── api/                  # 30+ domain route handlers (74+ production endpoints)
    │   ├── layout.tsx            # Root layout (AuthProvider, Geist fonts)
    │   └── page.tsx              # Root page (redirects to /login)
    ├── components/
    │   ├── auth/                 # Auth guards (AuthGuard, role boundaries)
    │   ├── dashboard/            # Executive KPI metrics and chart cards
    │   ├── fees/                 # Fee payment modals, installment cards, plan builders
    │   ├── layout/               # AppShell, TopNav, Sidebar, MobileNav, CommandSearch
    │   ├── navigation/           # NavIcon, active route markers
    │   ├── students/             # 6-step AdmissionWorkspace, roll rebalance dialog
    │   └── ui/                   # Headless UI primitives (Button, Dialog, Sheet, Tabs, etc.)
    ├── features/                 # Modular domain feature components
    │   ├── attendance/           # Daily register components
    │   ├── classes/              # Class & section builders
    │   ├── homework/             # Homework form sheet & assignment cards
    │   ├── settings/             # Settings hub components
    │   ├── shared/               # Shared feature components
    │   ├── subjects/             # Subject catalog cards
    │   ├── teachers/             # Faculty onboarding workspace & permissions editor
    │   └── timetable/            # Weekly timetable grid and period blocks
    ├── lib/                      # Core business services & utilities
    │   ├── auth/                 # Sessions, Scrypt crypto, TOTP MFA, OTP auth, authorize guard
    │   ├── communication/        # AudienceResolver & notification dispatcher
    │   ├── config/               # Environment variable validation & typing
    │   ├── email/                # Resend transactional email templates & dispatch
    │   ├── fees/                 # Plan versioning, payment allocation, reversals, PDF-lib engine
    │   ├── id-generator/         # Atomic sequential ID generator (IdSequence)
    │   ├── notices/              # Notice publishing & read receipts
    │   ├── prisma.ts             # Prisma client singleton
    │   ├── redis/                # Upstash Redis client with serverless resilience
    │   ├── results/              # Results calculation, CBSE grading, publication locks
    │   ├── roles/                # RoleService, permission matrices, built-in roles
    │   ├── security/             # AES-256-GCM field encryption for KYC at rest
    │   ├── settings/             # Centralized settings service
    │   ├── storage/              # Azure Blob direct SAS upload & magic-byte validation
    │   ├── students/             # Student admission, roll-number balancing service
    │   ├── teachers/             # Staff directory & document catalog
    │   ├── testing/              # Testing center runner, health adapter, load engine
    │   └── timetable/            # Timetable clash validation engine
    ├── shared/                   # Shared selectors, mock store, conflict validators
    ├── types/                    # Active TypeScript interfaces and domain models
    └── __tests__/                # 27 Integration, forensic, and security test suites
```

---

### 2.3 `apps/api` (NestJS Scaffold)
```
apps/api/
├── package.json                  # NestJS 12 dependencies, Vitest, Oxlint
├── tsconfig.json                 # NestJS TypeScript build configuration
└── src/
    ├── main.ts                   # Bootstrap entry (Helmet, ValidationPipe, CORS, Port 4000)
    ├── app.module.ts             # AppModule (ConfigModule, PrismaModule, HealthModule)
    ├── config/                   # Config validation via class-validator
    ├── database/                 # PrismaService with forSchool() tenant helper
    ├── common/                   # AllExceptionsFilter, guards, middleware
    └── modules/health/           # HealthModule (GET /api/v1/health only)
```

---

### 2.4 `apps/parent` (Flutter Mobile Client)
```
apps/parent/
├── pubspec.yaml                  # Flutter 3.x, Riverpod 2.5, Dio 5.4, GoRouter 14
├── lib/
│   ├── main.dart                 # Flutter entry point & Material 3 Dark theme setup
│   ├── core/                     # ApiClient (Dio), constants, token storage
│   ├── models/                   # Dart models for Student, Notice, ExamResult, User
│   ├── providers/                # Riverpod state providers (auth, parent, notices)
│   ├── routing/                  # GoRouter configuration
│   └── views/                    # Mobile screens (Login, MFA, Home, Notices, Results, Profile)
```

---

### 2.5 `prisma/` (Database Data Tier)
```
prisma/
├── schema.prisma                 # 67 Models, 30 Enums, Multi-Tenant Schema (72 KB)
├── seed.ts                       # Seed data: Platform Owner, Greenwood Academy, Roles
└── migrations/                   # 14 Chronological PostgreSQL schema migrations
```

