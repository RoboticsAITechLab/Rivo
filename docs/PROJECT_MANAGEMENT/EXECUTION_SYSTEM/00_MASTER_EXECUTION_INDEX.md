# RIVO — Master Execution Index & Central Control

> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO, Chief Product Officer & Lead Orchestrator  
> **Status:** Active Execution Framework | **Version:** 1.0.0-EXEC  
> **Location:** `docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/`  
> **Last Verified Checkpoint:** CHECKPOINT-000-BASELINE (12 November 2026)  

---

## 1. Project Objective & Ecosystem Mission
The objective of RIVO is to establish a secure, multi-tenant, commercially viable, and scalable School Management SaaS platform across seven unified stakeholder surfaces:
1. **School Admin Cockpit** (`apps/web/(school)`) — Desktop/Tablet administrative cockpit.
2. **Parent Mobile App** (`apps/parent`) — Native Flutter 3.x iOS/Android app.
3. **Parent Web Portal Fallback** (`apps/web/(parent)`) — Responsive zero-install desktop portal.
4. **Teacher Academic Portal & PWA** (`apps/web/(teacher)`) — Mobile-first PWA with offline roll-call sync.
5. **Student Academic Experience** — Hybrid K-8 (Parent App Student Mode) & 9-12 (`apps/web/student`).
6. **Rivo Platform Admin Console** (`apps/web/platform`) — Internal SaaS governance, licensing, & telemetry.
7. **Public School Portal & Online Admission** (`apps/web/schools/[slug]`) — Headless admissions ingress.

The production backend is the **Next.js 16.3.5 App Router modular monolith** (`apps/web`) backed by **Neon Serverless PostgreSQL 16**, **Upstash Redis**, and **Azure Blob Storage**.

---

## 2. Real-Time Execution Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RIVO EXECUTION COCKPIT                            │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Current Phase:       │ Phase 0 — Security & │ Overall Progress:             │
│                      │ Data Integrity       │ [░░░░░░░░░░░░░░░░░░░░] 0.0%   │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Active Milestone:    │ M0-CONTAINMENT       │ Total Registered Tasks: 52    │
│ Active Workstream:   │ Lead Orchestrator    │ Verified Completed Tasks: 0   │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Blocker Status:      │ 3 Critical Blockers  │ Pending Owner Approvals: 2    │
│ System Health:       │ STABLE / PRE-PROD    │ Next Gate: Security Gate 0    │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Critical Blockers Summary (Action Required Before Implementation)
1. **BLK-001 (P0 - Secret Rotation):** Database password for `neondb_owner` exposed in `.env.example`. Must be rotated in Neon Console and sanitized before any code commit.
2. **BLK-002 (P0 - Fee Race Condition):** `apps/web/src/lib/fees/fee-payment-service.ts` queries obligations without `FOR UPDATE` locks and generates sequences outside transaction.
3. **BLK-003 (P1 - Build Type Check):** `apps/web/next.config.ts` has `typescript.ignoreBuildErrors: true`, masking type errors during builds.

---

## 3. Execution System Document Map

All documents in this directory are interconnected and constitute the single source of truth for AI agents and human engineers:

### Core Governance & Protocols
| Document | Purpose | Primary Consumer |
| :--- | :--- | :--- |
| [**`01_EXECUTION_STRATEGY.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/01_EXECUTION_STRATEGY.md) | Execution methodology, verification rules, and change control | All AI Agents & Leads |
| [**`02_MASTER_PHASE_ROADMAP.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/02_MASTER_PHASE_ROADMAP.md) | 10-Phase detailed implementation roadmap with exit criteria | Orchestrator & Planner |
| [**`TASK_REGISTRY.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/TASK_REGISTRY.md) | Granular registry of all 52 tasks with states, owners & evidence | All Specialized Agents |
| [**`DEPENDENCY_MAP.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/DEPENDENCY_MAP.md) | Inter-task DAG, critical paths, and parallel execution clusters | Orchestrator & Schedulers |
| [**`AGENT_ORCHESTRATION.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/AGENT_ORCHESTRATION.md) | Multi-agent roles, file isolation boundaries, reporting format | AI Agent Dispatcher |
| [**`BLOCKER_AND_ESCALATION_PROTOCOL.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/BLOCKER_AND_ESCALATION_PROTOCOL.md) | Blocker taxonomy, 7-point escalation template, owner decision rules | All Agents & Owner |
| [**`QUALITY_GATES_AND_VERIFICATION.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/QUALITY_GATES_AND_VERIFICATION.md) | Objective verification criteria, test harnesses, and sign-off gates | QA & Security Agents |
| [**`FUTURE_EXECUTION_PROTOCOL.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/FUTURE_EXECUTION_PROTOCOL.md) | Step-by-step instructions for future prompts and task execution | Future Prompt Invocations |
| [**`CHECKPOINT_AND_RECOVERY_PROTOCOL.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/CHECKPOINT_AND_RECOVERY_PROTOCOL.md) | Milestone verification, state recovery from interrupted agent sessions | Lead Orchestrator |
| [**`EXECUTION_SAFETY_RULES.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/EXECUTION_SAFETY_RULES.md) | Non-negotiable security guardrails, credential rules, rollback policies | All Workstreams |

### Tracking & Audit Logs
| Document | Purpose | Update Frequency |
| :--- | :--- | :--- |
| [**`PROGRESS_TRACKER.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/PROGRESS_TRACKER.md) | Phase, module, and task metric calculation tables | After Every Task |
| [**`EXECUTION_LOG.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/EXECUTION_LOG.md) | Chronological append-only execution history and verification results | After Every Task |
| [**`DECISION_LOG.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/DECISION_LOG.md) | Architectural & product decision records (ADRs) | On Architectural Change |
| [**`CHANGELOG.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/CHANGELOG.md) | Version history of the execution management system | On Milestone Completion |

### Detailed Module Execution Plans
| Module Document | Domain Scope | Target Files |
| :--- | :--- | :--- |
| [**`MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md) | Monorepo packages, Next.js build, hermetic tests | `packages/*`, `next.config.ts`, `src/lib/prisma.ts` |
| [**`MODULE_02_AUTH_SECURITY_MFA.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_02_AUTH_SECURITY_MFA.md) | Scrypt auth, fail-closed rate limiters, session cache | `src/lib/auth/*`, `src/middleware.ts` |
| [**`MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md) | School onboarding, campus sessions, settings | `src/app/(school)/*`, `src/lib/settings/*` |
| [**`MODULE_04_STUDENT_MANAGEMENT_ROLL_BALANCING.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_04_STUDENT_MANAGEMENT_ROLL_BALANCING.md) | Student profiles, IDOR resolution, roll balance UI | `src/app/api/students/*`, `roll-number-service.ts` |
| [**`MODULE_05_FEE_MANAGEMENT_FINANCIAL_INTEGRITY.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_05_FEE_MANAGEMENT_FINANCIAL_INTEGRITY.md) | Concurrency locks, payment allocations, receipts | `src/lib/fees/*`, `src/app/api/fees/*` |
| [**`MODULE_06_ATTENDANCE_MANAGEMENT_OFFLINE.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_06_ATTENDANCE_MANAGEMENT_OFFLINE.md) | Classroom attendance, IndexedDB draft sync, audits | `src/app/(school)/attendance/*`, `src/app/api/attendance/*` |
| [**`MODULE_07_ACADEMICS_TIMETABLE_EXAMINATIONS.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_07_ACADEMICS_TIMETABLE_EXAMINATIONS.md) | Conflict engine, timetable slots, exam marks locking | `src/app/api/timetable/*`, `src/app/api/exams/*` |
| [**`MODULE_08_COMMUNICATION_NOTIFICATIONS_GATEWAY.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_08_COMMUNICATION_NOTIFICATIONS_GATEWAY.md) | 3-tier cascade (In-App/Push, WhatsApp, SMS OTP) | `src/lib/notifications/*`, `src/app/api/notices/*` |
| [**`MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md) | Flutter app, multi-child dropdown, fees & receipts | `apps/parent/lib/*`, `src/app/api/parent/*` |
| [**`MODULE_10_TEACHER_ECOSYSTEM_PWA.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_10_TEACHER_ECOSYSTEM_PWA.md) | Responsive PWA, one-tap attendance, homework, KYC | `src/app/(teacher)/*`, `src/app/api/teacher/*` |
| [**`MODULE_11_STUDENT_ECOSYSTEM_WEB.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_11_STUDENT_ECOSYSTEM_WEB.md) | Secondary student portal, homework turn-in model | `src/app/student/*`, `src/app/api/homework/submit/*` |
| [**`MODULE_12_PLATFORM_ADMIN_CONSOLE.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_12_PLATFORM_ADMIN_CONSOLE.md) | Multi-tenant SaaS governance, break-glass audit | `src/app/platform/*`, `src/lib/platform/*` |
| [**`MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md) | Headless profile `/schools/[slug]`, 4-step admission | `src/app/schools/*`, `src/app/api/admissions/*` |
| [**`MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`**](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md) | Health probes, structured JSON logs, Playwright E2E | `src/app/api/health/*`, `src/__tests__/*` |

---

## 4. Current Execution State & Recommended Next Action

- **Current State:** The Execution Management System is fully authored, structurally cross-linked, and validated against the Master Plan.
- **Pending Decision 1 (Project Owner):** Authorize rotation of database password for `neondb_owner` in Neon Console and replacement in `.env.example`.
- **Pending Decision 2 (Project Owner):** Authorize activating `RIVO-SEC-001` through `RIVO-SEC-004` (Phase 0: Security & Concurrency Containment).
- **Immediate Recommended Execution Prompt for Owner:**
  ```text
  "Begin Rivo Phase 0 implementation. Execute task RIVO-SEC-001 (Rotate Neon secrets and sanitize .env.example) and RIVO-SEC-002 (Pessimistic FOR UPDATE locks on fee payment allocations) following docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/FUTURE_EXECUTION_PROTOCOL.md."
  ```

