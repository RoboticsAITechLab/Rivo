# RIVO — Master Phase Roadmap & Milestone Specifications

> **Document:** `02_MASTER_PHASE_ROADMAP.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO & Lead Orchestrator | **Version:** 1.0.0-EXEC  

---

## Roadmap Overview

The Rivo development lifecycle is structured into 10 cohesive, verified phases covering 90 engineering days from initial security containment to unified commercial rollout:

```
Phase 0: Security & Concurrency Containment (Days 1–5)       [CRITICAL LAUNCH BLOCKER]
Phase 1: Shared Platform Foundation & Build Safety (Days 6–10)
Phase 2: School Admin MVP Completion (Days 11–18)
Phase 3: Parent Mobile App (Flutter) Completion (Days 19–30)
Phase 4: Teacher Academic Portal & PWA (Days 31–40)
Phase 5: Student Academic Experience (Days 41–48)
Phase 6: Platform Admin & SaaS Operations (Days 49–56)
Phase 7: Public School Portal & Online Admission (Days 57–65)
Phase 8: Cross-App Testing, SRE & Observability (Days 66–78)
Phase 9: Staging Validation & Production Commercial Launch (Days 79–90)
```

---

## Phase 0: Security & Concurrency Containment

- **Objective:** Eliminate active credential exposures, database-level financial concurrency vulnerabilities, and unauthorized data leakage before writing feature code.
- **Scope:**
  - Database credential rotation and environment template sanitization.
  - Concurrency locks on fee obligation allocation and sequence counters.
  - Object-level authorization on student profile API routes (IDOR remediation).
  - Fail-closed policy enforcement on Upstash Redis rate limiters.
- **Prerequisites:** Access to Neon PostgreSQL console for secret rotation; approved Task Registry.
- **Dependencies:** None (Baseline phase).
- **Deliverables:**
  - Sanitized `apps/web/.env.example` and `apps/api/.env.example` with dummy strings.
  - `apps/web/src/lib/fees/fee-payment-service.ts` updated with `SELECT ... FOR UPDATE` locks.
  - `apps/web/src/app/api/students/[id]/route.ts` enforcing teacher class/section assignment.
  - `apps/web/src/lib/auth/rate-limiter.ts` failing closed in production mode.
- **Assigned Tasks:**
  - `RIVO-SEC-001`: Rotate Neon database credentials & sanitize example environment files.
  - `RIVO-SEC-002`: Implement pessimistic `FOR UPDATE` locking in fee payment allocations.
  - `RIVO-SEC-003`: Enforce teacher class/section assignment check on `/api/students/[id]`.
  - `RIVO-SEC-004`: Enforce fail-closed policy in production rate limiters during Redis outage.
- **Required Agents:** Security Architect, Database Architect, Backend Engineer.
- **Verification Requirements:**
  - `npm run test:remediation` passes 100% of assertion groups including Group 3 fail-closed.
  - Concurrent payment allocation simulation proves zero over-allocation on $500 obligation.
  - Unassigned teacher session requesting student ID receives `HTTP 403 Forbidden`.
- **Exit Criteria / Sign-off Gate:** Security Gate 0 passed; zero plaintext passwords in git tree.
- **Risks & Complexity:** High complexity in transaction locking; risk of lock timeouts if queries are slow.

---

## Phase 1: Shared Platform Foundation & Build Safety

- **Objective:** Establish strict build verification, resilient client error boundaries, activated monorepo packages, and an offline hermetic test database harness.
- **Scope:**
  - Activate monorepo packages `packages/types` and `packages/validation`.
  - Fix all TypeScript compilation errors and remove `ignoreBuildErrors: true`.
  - Mount Sonner `<Toaster />` in root layout and deploy `error.tsx` / `not-found.tsx`.
  - Implement hermetic local test database harness decoupled from live cloud Neon DB.
- **Prerequisites:** Phase 0 complete and verified.
- **Dependencies:** Phase 0.
- **Deliverables:**
  - Active `packages/types` and `packages/validation` exporting shared Zod schemas and TypeScript models.
  - `apps/web/next.config.ts` with `typescript: { ignoreBuildErrors: false }`.
  - `apps/web/src/app/layout.tsx` mounting `<Toaster />`.
  - `apps/web/src/app/error.tsx` and `apps/web/src/app/not-found.tsx` deployed.
  - `npm run test:id` executing cleanly in offline environments via local database harness.
- **Assigned Tasks:**
  - `RIVO-ARCH-001`: Activate `packages/types` and export core shared domain models.
  - `RIVO-ARCH-002`: Activate `packages/validation` and export Zod request schemas.
  - `RIVO-BLD-001`: Resolve TypeScript compilation errors and set `ignoreBuildErrors: false`.
  - `RIVO-UI-001`: Mount Sonner `<Toaster />` in `apps/web/src/app/layout.tsx`.
  - `RIVO-UI-002`: Implement root and route-group `error.tsx` and `not-found.tsx` boundaries.
  - `RIVO-QA-001`: Implement hermetic test database runner for offline CI/CD execution.
- **Required Agents:** Principal Architect, Frontend Engineer, DevOps Engineer, QA Engineer.
- **Verification Requirements:**
  - `npx tsc --noEmit` exits with code 0 across the entire monorepo.
  - `npm run build` succeeds cleanly without build warnings.
  - `npm test` runs without requiring internet connectivity or live cloud endpoints.
- **Exit Criteria / Sign-off Gate:** Quality Gate 1 passed; strict build pipeline green.
- **Complexity:** Medium effort; multiple scattered type mismatch fixes.

---

## Phase 2: School Admin MVP Completion

- **Objective:** Complete missing administrative user journeys, eliminate UI state desynchronization, and finalize institutional setup cockpits.
- **Scope:**
  - Build Roll Number Rebalancing approval UI modal in `/school/academics/classes`.
  - Build Teacher KYC review and document verification interface in `/school/teachers/[id]`.
  - Decompose 1,532-line monolithic `school-store.ts` into domain SWR/React Query hooks.
  - Add composite index `@@index([schoolId, role])` to `SchoolMembership`.
- **Prerequisites:** Phase 1 complete.
- **Dependencies:** Phase 1 (Strict build and types active).
- **Deliverables:**
  - Roll Number Rebalance approval modal displaying alphabetical diff before transaction commit.
  - Teacher KYC document verification card with approve/reject actions and audit logging.
  - `school-store.ts` deleted and replaced by domain hooks (`useStudents`, `useClasses`, `useFees`).
  - Prisma migration deploying composite index on `SchoolMembership`.
- **Assigned Tasks:**
  - `RIVO-ADM-001`: Implement Roll Number Rebalance admin review and approval UI.
  - `RIVO-ADM-002`: Implement Teacher KYC review panel and document verification endpoints.
  - `RIVO-ADM-003`: Decompose monolithic `school-store.ts` into domain SWR hooks.
  - `RIVO-DB-001`: Deploy composite index `@@index([schoolId, role])` on `SchoolMembership`.
- **Required Agents:** Frontend Engineer, Backend Engineer, Database Architect.
- **Verification Requirements:**
  - Admin can preview and apply roll number rebalance with zero alphabetical collisions.
  - Teacher document verification updates KYC status and writes audit log entry.
  - All 27 frontend components operate seamlessly without importing `school-store.ts`.
- **Exit Criteria / Sign-off Gate:** Admin MVP Gate passed; core admin workflows operational.
- **Complexity:** High effort; store decomposition touches 27 components.

---

## Phase 3: Parent Mobile App (Flutter) Completion

- **Objective:** Upgrade `apps/parent` from a partial viewer into a complete, secure native mobile portal with multi-child switching, fee ledger review, online gateway checkout, and digital receipt downloads.
- **Scope:**
  - Implement Multi-Child dropdown switcher with Riverpod state isolation.
  - Build Fee Ledger and installment schedule view (`/api/parent/children/[id]/fees`).
  - Integrate native Razorpay/Cashfree checkout sheet for online payments.
  - Implement digital vector PDF receipt download and sharing via Dio and `share_plus`.
  - Implement attendance calendar heatmap and absence explanation submission.
- **Prerequisites:** Phase 0 (Payment locks) and Phase 1 (Types active).
- **Dependencies:** Phase 0, Phase 1.
- **Deliverables:**
  - Flutter `ChildSwitcher` dropdown in `AppBar` updating active student context.
  - `FeeLedgerView` displaying fee heads, installment breakdown, and paid/pending balances.
  - Razorpay mobile SDK checkout triggering backend webhook settlement.
  - `ReceiptDownloader` saving vector PDF receipts locally and launching native share dialog.
  - `AttendanceHeatmapView` with medical slip upload to Azure Blob Storage.
- **Assigned Tasks:**
  - `RIVO-PAR-001`: Implement multi-child switcher and Riverpod context isolation in Flutter.
  - `RIVO-PAR-002`: Build Parent Fee Ledger view and installment breakdown.
  - `RIVO-PAR-003`: Integrate Razorpay/Cashfree native checkout sheet with webhook verification.
  - `RIVO-PAR-004`: Implement Dio receipt PDF downloader and system share integration.
  - `RIVO-PAR-005`: Build Attendance Heatmap view and absence correction request workflow.
- **Required Agents:** Principal Mobile Architect (Flutter/Dart), Backend Engineer, Payment Specialist.
- **Verification Requirements:**
  - Parent with 2 children switches context without re-authenticating; zero cross-child data leakage.
  - Completed test payment generates digital receipt downloadable in < 2 seconds.
  - Mobile app runs smoothly at 60 FPS on low-end Android test device.
- **Exit Criteria / Sign-off Gate:** Parent Mobile Gate passed; app ready for internal closed testing.
- **Complexity:** High effort; mobile gateway integration and PDF handling.

---

## Phase 4: Teacher Academic Portal & PWA

- **Objective:** Deploy a mobile-first Responsive Web Portal and Progressive Web App (PWA) within `apps/web/(teacher)` enabling one-tap classroom attendance, marks locking, and offline sync.
- **Scope:**
  - Configure PWA manifest, service worker caching, and home-screen install prompts.
  - Implement 1-tap roll-call attendance roster sorted by alphabetical roll number.
  - Build IndexedDB offline attendance draft storage with background sync on Wi-Fi reconnect.
  - Implement examination marks entry matrix with draft autosave and principal locking.
- **Prerequisites:** Phase 1 and Phase 2 complete.
- **Dependencies:** Phase 1, Phase 2.
- **Deliverables:**
  - PWA manifest (`manifest.json`) and service worker registered in `(teacher)`.
  - One-tap attendance roster (`PRESENT` default, tap for `ABSENT`/`LATE`).
  - IndexedDB sync queue sending pending attendance drafts when online.
  - Marks entry grid with client-side bounds checking (`score <= maxMarks`) and locking button.
- **Assigned Tasks:**
  - `RIVO-TCH-001`: Configure PWA manifest, service worker, and offline asset caching.
  - `RIVO-TCH-002`: Implement one-tap classroom attendance interface with SMS trigger.
  - `RIVO-TCH-003`: Implement IndexedDB offline draft attendance synchronization queue.
  - `RIVO-TCH-004`: Implement examination marks entry matrix, draft saving, and locking workflow.
- **Required Agents:** Frontend Engineer (React/PWA), Backend Engineer.
- **Verification Requirements:**
  - Attendance marked with airplane mode enabled persists in IndexedDB and commits on reconnect.
  - Marking student `ABSENT` dispatches notification to Parent App in < 30 seconds.
- **Exit Criteria / Sign-off Gate:** Teacher PWA Gate passed; classroom workflows verified.
- **Complexity:** Medium effort; service worker and IndexedDB sync mechanics.

---

## Phase 5: Student Academic Experience

- **Objective:** Deliver age-appropriate academic visibility for secondary students (9–12) and supervised access for primary students (K–8).
- **Scope:**
  - Build Secondary Student Web Portal at `apps/web/src/app/student`.
  - Create database models for `HomeworkSubmission` and `HomeworkAttachment` in Prisma.
  - Wire persistent student homework turn-in API (`POST /api/homework/submit`).
  - Add K-8 "Student Mode" toggle in Flutter Parent Mobile App.
- **Prerequisites:** Phase 1 complete.
- **Dependencies:** Phase 1.
- **Deliverables:**
  - `/student` dashboard displaying timetable, assignments, datesheets, and term results.
  - Prisma migration adding `HomeworkSubmission` and `HomeworkAttachment`.
  - `POST /api/homework/submit` persisting student submission text and Azure Blob file keys.
  - Parent App "Student Mode" hiding fees, settings, and parental communications.
- **Assigned Tasks:**
  - `RIVO-STU-001`: Deploy Prisma models for `HomeworkSubmission` and `HomeworkAttachment`.
  - `RIVO-STU-002`: Implement persistent homework turn-in API and file upload handling.
  - `RIVO-STU-003`: Build Secondary Student Web Portal (`apps/web/src/app/student`).
  - `RIVO-STU-004`: Implement K-8 "Student Mode" visual toggle in Flutter Parent Mobile App.
- **Required Agents:** Backend Engineer, Frontend Engineer, Mobile Engineer.
- **Verification Requirements:**
  - Student submits PDF homework assignment; submission record and attachment persist in PostgreSQL.
  - Student portal enforces strict read-only access to academic resources; zero fee balance access.
- **Exit Criteria / Sign-off Gate:** Student Experience Gate passed.
- **Complexity:** Low-Medium effort.

---

## Phase 6: Platform Admin & SaaS Operations

- **Objective:** Deploy internal Rivo operations console (`/platform`) for school provisioning, subscription licensing, quota monitoring, and audited break-glass support.
- **Scope:**
  - Create database models for `PlatformTenant`, `SubscriptionPlan`, and `SupportAuditLog`.
  - Build tenant onboarding and lifecycle management interface (`PROVISION`, `ACTIVE`, `SUSPENDED`).
  - Implement resource telemetry dashboard (Neon DB size, Redis commands, Azure storage GB).
  - Implement time-limited (30m) audited break-glass support impersonation protocol.
- **Prerequisites:** Phase 1 complete.
- **Dependencies:** Phase 1.
- **Deliverables:**
  - Internal console at `/platform` gated by `PLATFORM_SUPER_ADMIN` role and hardware FIDO2 2FA.
  - Tenant provisioning wizard auto-generating school slug, default session, and primary admin.
  - Real-time quota meters showing student count, storage consumed, and WhatsApp credits.
  - Break-glass audit trail logging operator ID, ticket number, and accessed school ID.
- **Assigned Tasks:**
  - `RIVO-PLT-001`: Deploy Prisma models for `PlatformTenant` and `SupportAuditLog`.
  - `RIVO-PLT-002`: Build internal school tenant provisioning and subscription management UI.
  - `RIVO-PLT-003`: Build real-time resource telemetry and quota monitoring dashboard.
  - `RIVO-PLT-004`: Implement time-limited audited break-glass support access protocol.
- **Required Agents:** Backend Engineer, Security Architect, Frontend Engineer.
- **Verification Requirements:**
  - Non-platform user navigating to `/platform` receives `HTTP 404 Not Found`.
  - Break-glass session automatically expires after 30 minutes and writes immutable audit log.
- **Exit Criteria / Sign-off Gate:** Platform Operations Gate passed.
- **Complexity:** Medium effort; strict security boundaries required.

---

## Phase 7: Public School Portal & Online Admission

- **Objective:** Provide headless public institutional landing pages (`/schools/[slug]`) and a streamlined 4-step online admission application funnel.
- **Scope:**
  - Create `AdmissionInquiry` and `AdmissionDocument` models in `prisma/schema.prisma`.
  - Build serverless public school landing page rendering school branding, notices, and faculty.
  - Build 4-step online admission form with direct Azure Blob SAS document upload.
  - Build School Admin admission review, approval, and 1-click enrollment wizard.
- **Prerequisites:** Phase 1 and Phase 2 complete.
- **Dependencies:** Phase 1, Phase 2.
- **Deliverables:**
  - Headless public profile at `/schools/[slug]` with dynamic metadata and SEO tags.
  - 4-step admission form (Student Info -> Parent Info -> Document Upload -> Review & Submit).
  - Admin admission management panel in `/school/admissions` with Accept/Reject actions.
  - Approved admission automatically creates `Student`, `ParentStudent`, and `FeeObligation` rows.
- **Assigned Tasks:**
  - `RIVO-PUB-001`: Deploy Prisma models for `AdmissionInquiry` and `AdmissionDocument`.
  - `RIVO-PUB-002`: Build headless public school profile page (`apps/web/src/app/schools/[slug]`).
  - `RIVO-PUB-003`: Build 4-step online admission application form with direct SAS upload.
  - `RIVO-PUB-004`: Build School Admin admission review cockpit and 1-click enrollment wizard.
- **Required Agents:** Frontend Engineer, Backend Engineer, UX Designer.
- **Verification Requirements:**
  - Prospective parent submits application; record appears in School Admin queue within 1 second.
  - 1-click admission creates student and parent records without duplicating existing users.
- **Exit Criteria / Sign-off Gate:** Public Ingress Gate passed.
- **Complexity:** Medium effort.

---

## Phase 8: Cross-App Testing, SRE & Observability

- **Objective:** Execute comprehensive cross-application integration testing, load simulation, structured JSON logging, deep health probes, and disaster recovery testing.
- **Scope:**
  - Deploy structured JSON logging wrapper emitting `x-request-id`, tenant ID, and latency.
  - Implement deep readiness health probe (`GET /api/health/ready`) verifying DB and Redis.
  - Build Playwright cross-application end-to-end journey test suite.
  - Conduct k6 load testing against pooled database endpoints simulating 5,000 concurrent users.
  - Execute simulated Neon Point-in-Time Recovery (PITR) restore on staging branch.
- **Prerequisites:** Phases 0 through 7 complete.
- **Dependencies:** Phases 0–7.
- **Deliverables:**
  - Centralized structured logging across all API route handlers.
  - `/api/health/ready` probe returning HTTP 200 with database and Redis ping status.
  - Automated Playwright E2E suite covering complete student admission -> fee payment -> receipt journey.
  - Load test report demonstrating p95 latency < 350ms under peak roll-call load.
  - Verified disaster recovery runbook with documented RTO (< 30 min) and RPO (< 5 min).
- **Assigned Tasks:**
  - `RIVO-SRE-001`: Deploy structured JSON logging wrapper across all API route handlers.
  - `RIVO-SRE-002`: Implement deep readiness health probe (`/api/health/ready`).
  - `RIVO-QA-002`: Build Playwright cross-application end-to-end journey test suite.
  - `RIVO-SRE-003`: Execute k6 load testing and database connection pool optimization.
  - `RIVO-SRE-004`: Verify Neon Point-in-Time Recovery (PITR) and disaster recovery runbooks.
- **Required Agents:** SRE Lead, QA Automation Engineer, Database Architect.
- **Verification Requirements:**
  - Playwright E2E suite passes 100% across Chromium, Mobile Safari, and Android viewports.
  - Deep health probe returns HTTP 503 within 2 seconds of simulated Redis shutdown.
- **Exit Criteria / Sign-off Gate:** Reliability & SRE Gate passed.
- **Complexity:** High effort; multi-browser orchestration and load infrastructure.

---

## Phase 9: Staging Validation & Production Commercial Launch

- **Objective:** Perform white-glove pilot onboarding, app store distribution, and execute general commercial release.
- **Scope:**
  - Deploy final Release Candidate build to Vercel production environment.
  - Submit Flutter Parent App to Google Play Store and Apple App Store (TestFlight).
  - Execute white-glove onboarding for 2 pilot institutions.
  - Run automated daily financial reconciliation audit job at 23:59 IST.
  - Handoff operational runbooks and monitoring dashboards to Rivo support team.
- **Prerequisites:** Phase 8 complete; all Launch Gates signed off.
- **Dependencies:** Phases 0 through 8.
- **Deliverables:**
  - Live production SaaS deployment on custom domain (`app.rivo.school`).
  - Published Parent Mobile App in Google Play Store and Apple App Store.
  - 2 pilot schools actively marking attendance and collecting real fee transactions.
  - Automated daily financial reconciliation job alerting on any payment-allocation discrepancy.
- **Assigned Tasks:**
  - `RIVO-OPS-001`: Prepare production release candidate build and verify Vercel environment variables.
  - `RIVO-OPS-002`: Package and submit Flutter Parent App to Google Play and Apple TestFlight.
  - `RIVO-OPS-003`: Execute white-glove onboarding for 2 pilot institutions.
  - `RIVO-OPS-004`: Activate automated daily financial reconciliation cron job.
  - `RIVO-OPS-005`: Final CTO commercial launch sign-off and operational handoff.
- **Required Agents:** CTO, Engineering Director, DevOps Engineer, Mobile Release Specialist.
- **Verification Requirements:**
  - Pilot school collects live UPI payment; receipt downloads instantly on parent phone; zero ledger discrepancy.
  - Zero P0 or P1 incidents recorded during initial 7 days of live operations.
- **Exit Criteria / Sign-off Gate:** Commercial Launch Sign-Off; project transitions to post-launch ops.
- **Complexity:** High organizational and operational coordination.

