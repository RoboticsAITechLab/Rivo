# RIVO — Master Task Registry

> **Document:** `TASK_REGISTRY.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO & Lead Orchestrator | **Version:** 1.0.0-EXEC  
> **Status Schema:** `NOT_STARTED` | `READY` | `IN_PROGRESS` | `BLOCKED` | `UNDER_REVIEW` | `VERIFIED` | `COMPLETED` | `DEFERRED`  

---

## 1. Task Registry Overview & Summary Metrics

Total Registered Tasks: **52**  
- **Phase 0 (Security & Concurrency):** 4 Tasks (`RIVO-SEC-001` to `004`)
- **Phase 1 (Platform Foundation & Build):** 6 Tasks (`RIVO-ARCH-001`, `002`, `RIVO-BLD-001`, `RIVO-UI-001`, `002`, `RIVO-QA-001`)
- **Phase 2 (School Admin MVP):** 4 Tasks (`RIVO-ADM-001` to `003`, `RIVO-DB-001`)
- **Phase 3 (Parent Mobile App):** 5 Tasks (`RIVO-PAR-001` to `005`)
- **Phase 4 (Teacher PWA):** 4 Tasks (`RIVO-TCH-001` to `004`)
- **Phase 5 (Student Experience):** 4 Tasks (`RIVO-STU-001` to `004`)
- **Phase 6 (Platform Admin Console):** 4 Tasks (`RIVO-PLT-001` to `004`)
- **Phase 7 (Public Portal & Admission):** 4 Tasks (`RIVO-PUB-001` to `004`)
- **Phase 8 (Testing, SRE & Observability):** 5 Tasks (`RIVO-SRE-001` to `004`, `RIVO-QA-002`)
- **Phase 9 (Release & Commercial Launch):** 5 Tasks (`RIVO-OPS-001` to `005`)

---

## 2. Granular Task Registry

### Phase 0: Security & Concurrency Containment

#### `RIVO-SEC-001`
- **Title:** Rotate Neon Database Secrets & Sanitize Environment Example Templates
- **Parent Phase:** Phase 0 | **Related Module:** `MODULE_02_AUTH_SECURITY_MFA.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `READY` (Awaiting Owner Decision)
- **Dependencies:** None
- **Assigned Agent:** Security Architect
- **Target Files:** `apps/web/.env.example`, `apps/api/.env.example`, Neon Console
- **Required Inputs:** Owner rotated password in Neon Console; placeholder template strings.
- **Expected Output:** `.env.example` files contain only `postgresql://user:password@localhost:5432/dbname`. Zero plaintext secrets in repo.
- **Verification Method:** Grep repository for `npg_8qBxHNXL2htz`; test connection with rotated password.
- **Acceptance Criteria:** `git diff` shows only dummy placeholders; live cloud credentials purged.
- **Rollback Strategy:** Revert commit if local developer environments cannot resolve mock examples.

#### `RIVO-SEC-002`
- **Title:** Implement Pessimistic `FOR UPDATE` Row Locks in Fee Payment Allocation
- **Parent Phase:** Phase 0 | **Related Module:** `MODULE_05_FEE_MANAGEMENT_FINANCIAL_INTEGRITY.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `READY`
- **Dependencies:** `RIVO-SEC-001`
- **Assigned Agent:** Database Architect & Backend Engineer
- **Target Files:** `apps/web/src/lib/fees/fee-payment-service.ts`
- **Required Inputs:** `fee-payment-service.ts` source code; Prisma client transaction API.
- **Expected Output:** Obligation queries wrapped in raw SQL or Prisma interactive transaction with `FOR UPDATE` lock. Sequential payment and receipt numbers generated strictly *inside* the transaction.
- **Verification Method:** Execute simulated parallel payment script with 2 concurrent $500 requests against single $500 obligation.
- **Acceptance Criteria:** Exactly one payment commits; second request rejects with "Balance already paid"; zero duplicate allocation rows.
- **Rollback Strategy:** Restore pre-lock version from git; rerun fee foundation test suite.

#### `RIVO-SEC-003`
- **Title:** Enforce Object-Level Authorization on Student Profile Route (`/api/students/[id]`)
- **Parent Phase:** Phase 0 | **Related Module:** `MODULE_04_STUDENT_MANAGEMENT_ROLL_BALANCING.md`
- **Priority:** **P1 (High)** | **Current Status:** `READY`
- **Dependencies:** None (Can run in parallel with `RIVO-SEC-002`)
- **Assigned Agent:** Backend Engineer & Security Architect
- **Target Files:** `apps/web/src/app/api/students/[id]/route.ts`
- **Required Inputs:** Session context; `TeacherAssignment` table relationships.
- **Expected Output:** If user role is `TEACHER`, query verifies teacher is assigned to student's class/section. Non-privileged roles have financial balances (`feeObligations`) and KYC documents stripped from response.
- **Verification Method:** Test request with Teacher A session for Student B in Class 10 returns HTTP 403.
- **Acceptance Criteria:** Zero IDOR leakage across unassigned classes.
- **Rollback Strategy:** Revert route handler to previous revision.

#### `RIVO-SEC-004`
- **Title:** Enforce Fail-Closed Policy on Production Redis Rate Limiters
- **Parent Phase:** Phase 0 | **Related Module:** `MODULE_02_AUTH_SECURITY_MFA.md`
- **Priority:** **P1 (High)** | **Current Status:** `READY`
- **Dependencies:** None
- **Assigned Agent:** Security Architect & Backend Engineer
- **Target Files:** `apps/web/src/lib/auth/rate-limiter.ts`
- **Required Inputs:** `rate-limiter.ts` source; `remediation-forensic-hardening.test.ts`.
- **Expected Output:** When `process.env.NODE_ENV === 'production'` and Redis connection is down, `consume()` returns `allowed: false` for authentication routes.
- **Verification Method:** Run `npm run test:remediation`.
- **Acceptance Criteria:** Group 3 assertion: `RateLimiter in production mode strictly fails closed when Redis is unavailable` passes (returns true).
- **Rollback Strategy:** Revert changes to `rate-limiter.ts`.

---

### Phase 1: Shared Platform Foundation & Build Safety

#### `RIVO-ARCH-001`
- **Title:** Activate `packages/types` and Export Core Shared Domain Models
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** Principal Architect
- **Target Files:** `packages/types/src/index.ts`, `packages/types/package.json`
- **Expected Output:** Monorepo package exporting TypeScript interfaces for `Student`, `FeeObligation`, `AttendanceRoster`, `Notice`.

#### `RIVO-ARCH-002`
- **Title:** Activate `packages/validation` and Export Shared Zod Request Schemas
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-ARCH-001`
- **Assigned Agent:** Backend Engineer
- **Target Files:** `packages/validation/src/index.ts`, `packages/validation/package.json`
- **Expected Output:** Shared Zod validation schemas for admissions, payments, and homework.

#### `RIVO-BLD-001`
- **Title:** Resolve TypeScript Compilation Errors and Set `ignoreBuildErrors: false`
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-ARCH-001`
- **Assigned Agent:** Frontend Engineer & QA Engineer
- **Target Files:** `apps/web/next.config.ts`, `apps/web/src/**/*.ts*`
- **Expected Output:** `npx tsc --noEmit` exits with 0; `ignoreBuildErrors: false` active in `next.config.ts`.

#### `RIVO-UI-001`
- **Title:** Mount Sonner `<Toaster />` in Root Layout
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** None
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/layout.tsx`
- **Expected Output:** `<Toaster position="top-right" richColors />` mounted inside `RootLayout`.

#### `RIVO-UI-002`
- **Title:** Implement Root and Route-Group `error.tsx` and `not-found.tsx` Boundaries
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** None
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/error.tsx`, `apps/web/src/app/not-found.tsx`, `apps/web/src/app/(school)/error.tsx`
- **Expected Output:** Clean, branded fallback error screens with diagnostic IDs and retry actions.

#### `RIVO-QA-001`
- **Title:** Implement Hermetic Test Database Harness for Offline CI/CD Execution
- **Parent Phase:** Phase 1 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** DevOps & QA Engineer
- **Target Files:** `apps/web/src/__tests__/test-database-harness.ts`, `apps/web/src/__tests__/id-generator.test.ts`
- **Expected Output:** Test harness intercepts database queries with an isolated local/test database so `npm run test:id` executes offline without network error.

---

### Phase 2: School Admin MVP Completion

#### `RIVO-ADM-001`
- **Title:** Implement Roll Number Rebalance Admin Review and Approval UI
- **Parent Phase:** Phase 2 | **Related Module:** `MODULE_04_STUDENT_MANAGEMENT_ROLL_BALANCING.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/(school)/school/academics/classes/[id]/roll-numbers/page.tsx`
- **Expected Output:** Admin UI displaying current vs rebalanced alphabetical roll numbers with 1-click confirmation calling `executeRollNumberRebalance`.

#### `RIVO-ADM-002`
- **Title:** Implement Teacher KYC Review Panel & Document Verification Endpoints
- **Parent Phase:** Phase 2 | **Related Module:** `MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** Backend & Frontend Engineer
- **Target Files:** `apps/web/src/app/(school)/school/teachers/[id]/page.tsx`, `apps/web/src/app/api/teachers/[id]/kyc/route.ts`
- **Expected Output:** Review card allowing principal to inspect teacher certificates, mark `VERIFIED`/`REJECTED`, and log verification audit timestamps.

#### `RIVO-ADM-003`
- **Title:** Decompose Monolithic `school-store.ts` into Domain SWR Hooks
- **Parent Phase:** Phase 2 | **Related Module:** `MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** Frontend Lead
- **Target Files:** `apps/web/src/shared/mock-store/school-store.ts`, 27 importing component files
- **Expected Output:** `school-store.ts` deleted. Replaced with domain hooks (`useStudents`, `useClasses`, `useFees`) fetching live server state with SWR caching.

#### `RIVO-DB-001`
- **Title:** Deploy Composite Index `@@index([schoolId, role])` on `SchoolMembership`
- **Parent Phase:** Phase 2 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** Database Architect
- **Target Files:** `prisma/schema.prisma`, `prisma/migrations/*`
- **Expected Output:** Migration deploying composite index `@@index([schoolId, role])`, optimizing multi-tenant staff and student queries.

---

### Phase 3: Parent Mobile App (Flutter) Completion

#### `RIVO-PAR-001`
- **Title:** Implement Multi-Child Switcher & Riverpod Context Isolation in Flutter
- **Parent Phase:** Phase 3 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0, Phase 1
- **Assigned Agent:** Principal Mobile Architect
- **Target Files:** `apps/parent/lib/views/home_view.dart`, `apps/parent/lib/providers/parent_provider.dart`
- **Expected Output:** `AppBar` child dropdown; selecting a child switches `selectedChildProvider` and reloads downstream tabs with zero cross-child data leakage.

#### `RIVO-PAR-002`
- **Title:** Build Parent Fee Ledger View & Installment Breakdown in Flutter
- **Parent Phase:** Phase 3 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PAR-001`
- **Assigned Agent:** Mobile Engineer
- **Target Files:** `apps/parent/lib/views/fee_ledger_view.dart`, `apps/parent/lib/providers/fee_provider.dart`
- **Expected Output:** Screen displaying total annual fees, breakdown by installment, due dates, concession discounts, and live balance due.

#### `RIVO-PAR-003`
- **Title:** Integrate Razorpay/Cashfree Native Mobile Checkout Sheet with Webhook Settlement
- **Parent Phase:** Phase 3 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PAR-002`, `RIVO-SEC-002`
- **Assigned Agent:** Mobile Engineer & Backend Engineer
- **Target Files:** `apps/parent/lib/core/payment_service.dart`, `apps/web/src/app/api/webhooks/razorpay/route.ts`
- **Expected Output:** Native checkout sheet opens for UPI/card payment; webhook captures event and invokes `recordFeePayment` inside locked transaction.

#### `RIVO-PAR-004`
- **Title:** Implement Dio Receipt PDF Downloader and Native Share Sheet Integration
- **Parent Phase:** Phase 3 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PAR-003`
- **Assigned Agent:** Mobile Engineer
- **Target Files:** `apps/parent/lib/views/receipt_detail_view.dart`
- **Expected Output:** 1-tap download streams PDF from `/api/parent/children/[id]/receipts/[receiptId]/pdf`, saves locally, and opens native share dialog.

#### `RIVO-PAR-005`
- **Title:** Build Attendance Heatmap View and Absence Correction Request Workflow
- **Parent Phase:** Phase 3 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PAR-001`
- **Assigned Agent:** Mobile Engineer
- **Target Files:** `apps/parent/lib/views/attendance_view.dart`
- **Expected Output:** Monthly heatmap calendar with green/amber/red status badges and form to submit medical slip photo to Azure Blob Storage.

---

### Phase 4: Teacher Academic Portal & PWA

#### `RIVO-TCH-001`
- **Title:** Configure PWA Manifest, Service Worker, and Offline Asset Caching
- **Parent Phase:** Phase 4 | **Related Module:** `MODULE_10_TEACHER_ECOSYSTEM_PWA.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** Frontend Engineer (PWA Specialist)
- **Target Files:** `apps/web/public/manifest.json`, `apps/web/src/app/(teacher)/layout.tsx`
- **Expected Output:** Installable PWA with app icon, offline fallback page, and precached static assets.

#### `RIVO-TCH-002`
- **Title:** Implement One-Tap Classroom Attendance Interface with SMS Alert Trigger
- **Parent Phase:** Phase 4 | **Related Module:** `MODULE_10_TEACHER_ECOSYSTEM_PWA.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-TCH-001`
- **Assigned Agent:** Frontend & Backend Engineer
- **Target Files:** `apps/web/src/app/(teacher)/teacher/attendance/page.tsx`, `apps/web/src/app/api/attendance/route.ts`
- **Expected Output:** Roster defaulted to `PRESENT`; tap toggles `ABSENT`/`LATE`. Submitting attendance triggers SMS/WhatsApp alerts to absent students' parents.

#### `RIVO-TCH-003`
- **Title:** Implement IndexedDB Offline Draft Attendance Synchronization Queue
- **Parent Phase:** Phase 4 | **Related Module:** `MODULE_10_TEACHER_ECOSYSTEM_PWA.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-TCH-002`
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/lib/offline/attendance-queue.ts`
- **Expected Output:** Attendance marked without network connectivity persists in IndexedDB and commits automatically upon Wi-Fi reconnect.

#### `RIVO-TCH-004`
- **Title:** Implement Examination Marks Entry Matrix, Draft Saving, and Locking Workflow
- **Parent Phase:** Phase 4 | **Related Module:** `MODULE_10_TEACHER_ECOSYSTEM_PWA.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** Frontend & Backend Engineer
- **Target Files:** `apps/web/src/app/(teacher)/teacher/exams/marks/page.tsx`
- **Expected Output:** Matrix grid for entering student marks; "Save Draft" vs "Final Submit & Lock" with principal authorization guard.

---

### Phase 5: Student Academic Experience

#### `RIVO-STU-001`
- **Title:** Deploy Prisma Models for `HomeworkSubmission` and `HomeworkAttachment`
- **Parent Phase:** Phase 5 | **Related Module:** `MODULE_11_STUDENT_ECOSYSTEM_WEB.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** Database Architect
- **Target Files:** `prisma/schema.prisma`, `prisma/migrations/*`
- **Expected Output:** Models deployed with relations to `Homework` and `Student` to persist homework turn-in data.

#### `RIVO-STU-002`
- **Title:** Implement Persistent Homework Turn-In API and File Upload Handling
- **Parent Phase:** Phase 5 | **Related Module:** `MODULE_11_STUDENT_ECOSYSTEM_WEB.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-STU-001`
- **Assigned Agent:** Backend Engineer
- **Target Files:** `apps/web/src/app/api/homework/submit/route.ts`
- **Expected Output:** Replaces mock response with database write to `HomeworkSubmission` and stores Azure Blob file keys.

#### `RIVO-STU-003`
- **Title:** Build Secondary Student Web Portal (`apps/web/src/app/student`)
- **Parent Phase:** Phase 5 | **Related Module:** `MODULE_11_STUDENT_ECOSYSTEM_WEB.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-STU-002`
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/student/page.tsx`, `apps/web/src/app/student/homework/page.tsx`
- **Expected Output:** Clean, mobile-responsive portal for grades 9–12 showing timetable, homework turn-in, and published marks. Zero fee access.

#### `RIVO-STU-004`
- **Title:** Implement K-8 "Student Mode" Visual Toggle in Flutter Parent Mobile App
- **Parent Phase:** Phase 5 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 3
- **Assigned Agent:** Mobile Engineer
- **Target Files:** `apps/parent/lib/views/student_mode_view.dart`
- **Expected Output:** Parent app toggle switching UI to kid-friendly visual timetable and homework checklist without access to payments or settings.

---

### Phase 6: Platform Admin & SaaS Operations

#### `RIVO-PLT-001`
- **Title:** Deploy Prisma Models for `PlatformTenant`, `SubscriptionPlan`, and `SupportAuditLog`
- **Parent Phase:** Phase 6 | **Related Module:** `MODULE_12_PLATFORM_ADMIN_CONSOLE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** Database Architect
- **Target Files:** `prisma/schema.prisma`, `prisma/migrations/*`
- **Expected Output:** Models deployed to manage school tenant lifecycles, student quotas, and support audit records.

#### `RIVO-PLT-002`
- **Title:** Build Internal School Tenant Provisioning and Subscription Management UI
- **Parent Phase:** Phase 6 | **Related Module:** `MODULE_12_PLATFORM_ADMIN_CONSOLE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PLT-001`
- **Assigned Agent:** Frontend & Backend Engineer
- **Target Files:** `apps/web/src/app/platform/schools/page.tsx`, `apps/web/src/app/api/platform/schools/route.ts`
- **Expected Output:** Wizard to provision school tenant, assign domain slug, set student quota, and activate/suspend institutions.

#### `RIVO-PLT-003`
- **Title:** Build Real-Time Resource Telemetry and Quota Monitoring Dashboard
- **Parent Phase:** Phase 6 | **Related Module:** `MODULE_12_PLATFORM_ADMIN_CONSOLE.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PLT-002`
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/platform/telemetry/page.tsx`
- **Expected Output:** Dashboard displaying Neon DB sizes, Redis commands, Azure storage GB, and WhatsApp notification usage.

#### `RIVO-PLT-004`
- **Title:** Implement Time-Limited Audited Break-Glass Support Access Protocol
- **Parent Phase:** Phase 6 | **Related Module:** `MODULE_12_PLATFORM_ADMIN_CONSOLE.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PLT-001`
- **Assigned Agent:** Security Architect & Backend Engineer
- **Target Files:** `apps/web/src/lib/platform/break-glass.ts`
- **Expected Output:** Generates temporary 30-minute read-only support session requiring ticket ID; writes immutable `SupportAuditLog` record.

---

### Phase 7: Public School Portal & Online Admission

#### `RIVO-PUB-001`
- **Title:** Deploy Prisma Models for `AdmissionInquiry` and `AdmissionDocument`
- **Parent Phase:** Phase 7 | **Related Module:** `MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** Database Architect
- **Target Files:** `prisma/schema.prisma`, `prisma/migrations/*`
- **Expected Output:** Models deployed to track prospective student applications and uploaded verification documents.

#### `RIVO-PUB-002`
- **Title:** Build Headless Public School Profile Page (`apps/web/src/app/schools/[slug]`)
- **Parent Phase:** Phase 7 | **Related Module:** `MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PUB-001`
- **Assigned Agent:** Frontend Engineer
- **Target Files:** `apps/web/src/app/schools/[slug]/page.tsx`
- **Expected Output:** Publicly accessible, responsive school landing page displaying school branding, notices, and direct "Apply Online" button.

#### `RIVO-PUB-003`
- **Title:** Build 4-Step Online Admission Application Form with Direct Azure SAS Upload
- **Parent Phase:** Phase 7 | **Related Module:** `MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PUB-002`
- **Assigned Agent:** Frontend & Backend Engineer
- **Target Files:** `apps/web/src/app/schools/[slug]/apply/page.tsx`, `apps/web/src/app/api/admissions/inquiry/route.ts`
- **Expected Output:** 4-step wizard (Student Info -> Parent Info -> Documents -> Review & Submit) with direct Azure Blob SAS uploads.

#### `RIVO-PUB-004`
- **Title:** Build School Admin Admission Review Cockpit and 1-Click Enrollment Wizard
- **Parent Phase:** Phase 7 | **Related Module:** `MODULE_13_PUBLIC_PORTAL_ONLINE_ADMISSION.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-PUB-003`
- **Assigned Agent:** Frontend & Backend Engineer
- **Target Files:** `apps/web/src/app/(school)/school/admissions/page.tsx`
- **Expected Output:** Admin review cockpit with 1-click "Admit & Enroll" button auto-generating `Student`, `ParentStudent`, and `FeeObligation` records.

---

### Phase 8: Cross-App Testing, SRE & Observability

#### `RIVO-SRE-001`
- **Title:** Deploy Structured JSON Logging Wrapper Across All API Route Handlers
- **Parent Phase:** Phase 8 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 1
- **Assigned Agent:** SRE Lead
- **Target Files:** `apps/web/src/lib/logger.ts`, `apps/web/src/app/api/**/route.ts`
- **Expected Output:** Structured logs emitting `timestamp`, `level`, `requestId`, `schoolId`, `route`, and sanitized message.

#### `RIVO-SRE-002`
- **Title:** Implement Deep Readiness Health Probe (`GET /api/health/ready`)
- **Parent Phase:** Phase 8 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** SRE Lead & Backend Engineer
- **Target Files:** `apps/web/src/app/api/health/ready/route.ts`
- **Expected Output:** Endpoint checking PostgreSQL `SELECT 1` and Redis `PING`. Returns HTTP 200 if healthy, HTTP 503 if degraded.

#### `RIVO-QA-002`
- **Title:** Build Playwright Cross-Application End-to-End Journey Test Suite
- **Parent Phase:** Phase 8 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phases 1–7
- **Assigned Agent:** QA Automation Lead
- **Target Files:** `apps/web/e2e/student-lifecycle.spec.ts`, `apps/web/e2e/fee-collection.spec.ts`
- **Expected Output:** Automated Playwright suite testing complete journey: Admin admits student -> Parent pays fee -> Receipt PDF downloads.

#### `RIVO-SRE-003`
- **Title:** Execute k6 Load Testing & Database Connection Pool Optimization
- **Parent Phase:** Phase 8 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P2 (Medium)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-SRE-002`
- **Assigned Agent:** SRE Lead & Performance Engineer
- **Target Files:** `tests/load/k6-roster-spike.js`
- **Expected Output:** Benchmark report showing p95 latency < 350ms under 5,000 simulated concurrent requests; PgBouncer connection limits verified.

#### `RIVO-SRE-004`
- **Title:** Verify Neon Point-in-Time Recovery (PITR) and Disaster Recovery Runbooks
- **Parent Phase:** Phase 8 | **Related Module:** `MODULE_14_TESTING_QA_SRE_OBSERVABILITY.md`
- **Priority:** **P1 (High)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 0
- **Assigned Agent:** SRE Lead & Database Architect
- **Target Files:** `docs/INFRASTRUCTURE/DISASTER_RECOVERY_RUNBOOK.md`
- **Expected Output:** Point-in-time recovery test executed on staging Neon branch, validating RTO < 30 minutes and RPO < 5 minutes.

---

### Phase 9: Staging Validation & Production Commercial Launch

#### `RIVO-OPS-001`
- **Title:** Prepare Production Release Candidate Build & Verify Vercel Environment Variables
- **Parent Phase:** Phase 9 | **Related Module:** `MODULE_01_CORE_ARCHITECTURE_INFRASTRUCTURE.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phases 0–8
- **Assigned Agent:** DevOps Lead
- **Target Files:** Vercel Dashboard, `.env.production`
- **Expected Output:** Vercel production deployment artifact verified with clean environment variable bindings and zero build warnings.

#### `RIVO-OPS-002`
- **Title:** Package and Submit Flutter Parent App to Google Play Store & Apple TestFlight
- **Parent Phase:** Phase 9 | **Related Module:** `MODULE_09_PARENT_ECOSYSTEM_FLUTTER.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** Phase 3, `RIVO-OPS-001`
- **Assigned Agent:** Mobile Release Specialist
- **Target Files:** `apps/parent/android/app/build.gradle`, `apps/parent/ios/Runner.xcodeproj`
- **Expected Output:** Signed production APK/AAB uploaded to Google Play Console Closed Testing; iOS archive submitted to TestFlight.

#### `RIVO-OPS-003`
- **Title:** Execute White-Glove Onboarding for 2 Pilot Partner Institutions
- **Parent Phase:** Phase 9 | **Related Module:** `MODULE_03_SCHOOL_ADMINISTRATION_SETTINGS.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-OPS-001`
- **Assigned Agent:** CTO & Implementation Lead
- **Target Files:** Pilot School Database Instances
- **Expected Output:** 2 real schools onboarded; students imported; fee plans published; staff accounts activated.

#### `RIVO-OPS-004`
- **Title:** Activate Automated Daily Financial Reconciliation Cron Job
- **Parent Phase:** Phase 9 | **Related Module:** `MODULE_05_FEE_MANAGEMENT_FINANCIAL_INTEGRITY.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** `RIVO-SEC-002`, `RIVO-OPS-001`
- **Assigned Agent:** Backend Engineer & SRE Lead
- **Target Files:** `apps/web/src/app/api/cron/reconcile-fees/route.ts`
- **Expected Output:** Scheduled job running at 23:59 IST querying payment-vs-allocation parity and alerting on any discrepancy.

#### `RIVO-OPS-005`
- **Title:** Final CTO Commercial Launch Sign-Off and Operational Handoff
- **Parent Phase:** Phase 9 | **Related Module:** `00_MASTER_EXECUTION_INDEX.md`
- **Priority:** **P0 (Critical)** | **Current Status:** `NOT_STARTED`
- **Dependencies:** All previous tasks (`RIVO-SEC-001` through `RIVO-OPS-004`)
- **Assigned Agent:** CTO & Engineering Director
- **Target Files:** `docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/PROGRESS_TRACKER.md`
- **Expected Output:** Formal sign-off declaring all 7 launch gates GREEN; general commercial availability announced.
