# RIVO — Module 12: Platform Admin & SaaS Operations

> **Document:** `MODULE_12_PLATFORM_ADMIN_CONSOLE.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** CTO & Lead Systems Architect | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Deliver an internal SaaS operations console (`/platform`) for Rivo executive and support teams to provision school tenants, manage subscription licenses, monitor database/storage telemetry, and execute audited break-glass technical support sessions without compromising school data privacy.

---

## 2. Existing Implementation Status
- Basic platform roles exist in `PlatformRole` enum (`SUPER_ADMIN`, `SUPPORT`, `SALES`).
- Gaps: No platform route group exists in `apps/web/src/app`; no models exist for tenant billing or support audit logs.

---

## 3. Required Final Functionality
- School tenant provisioning wizard auto-generating school slug, default session, and primary administrator.
- Subscription tier management (Starter, Professional, Enterprise) enforcing student quotas.
- Real-time cloud resource telemetry (Neon DB storage, Upstash Redis commands, Azure Blob GB, WhatsApp credits).
- Audited 30-minute break-glass support impersonation protocol writing immutable `SupportAuditLog` entries.

---

## 4. Technical Requirements
- Next.js 16 internal route group (`apps/web/src/app/platform`).
- FIDO2 Hardware WebAuthn 2FA / TOTP requirement for all platform operators.
- IP allowlist enforcement in middleware for `/platform/*` routes.

---

## 5. Frontend Tasks
- `RIVO-PLT-002`: Build internal tenant provisioning and subscription UI at `apps/web/src/app/platform/schools/page.tsx`.
- `RIVO-PLT-003`: Build real-time resource telemetry dashboard at `apps/web/src/app/platform/telemetry/page.tsx`.

---

## 6. Backend Tasks
- Build tenant management API at `apps/web/src/app/api/platform/schools/route.ts`.
- `RIVO-PLT-004`: Implement time-limited audited break-glass support access protocol in `apps/web/src/lib/platform/break-glass.ts`.

---

## 7. Database Tasks
- `RIVO-PLT-001`: Deploy Prisma models:
  ```prisma
  model PlatformTenant {
    id             String         @id @default(uuid())
    schoolId       String         @unique
    tier           String         @default("STARTER")
    studentQuota   Int            @default(500)
    storageQuotaGB Int            @default(10)
    status         TenantStatus   @default(ACTIVE)
    billingCycle   String         @default("ANNUAL")
    createdAt      DateTime       @default(now())
    school         School         @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  }

  model SupportAuditLog {
    id             String   @id @default(uuid())
    operatorId     String
    schoolId       String
    ticketNumber   String
    reason         String
    startedAt      DateTime @default(now())
    expiresAt      DateTime
    ipAddress      String
  }
  ```

---

## 8. API Requirements
- `POST /api/platform/schools`: Provisions institution, creates default admin, seeds standard role permissions.
- `POST /api/platform/support/break-glass`: Generates 30-minute temporary read-only support session token.

---

## 9. Security Requirements
- Gated strictly by `auth.platformRole === 'SUPER_ADMIN'`.
- All support impersonation sessions expire in exactly 30 minutes; write immutable audit records.
- Platform operators cannot view unmasked student KYC or Aadhaar numbers.

---

## 10. UI/UX Requirements
- High-contrast dark operational theme with prominent red banner when active in "Break-Glass Support Mode".
- 1-click tenant status controls: `ACTIVE`, `SUSPENDED_NONPAYMENT`, `ARCHIVED`.

---

## 11. Integration Dependencies
- Monitors Neon PostgreSQL, Upstash Redis, and Azure Blob Storage usage metrics.

---

## 12. Error and Edge-Case Handling
- Unauthorized user accessing `/platform` receives `HTTP 404 Not Found` (revealing zero existence).
- School reaching student quota displays warning banner in School Admin: "Student quota reached (500/500). Please upgrade plan."

---

## 13. Testing Strategy
- Security test: School admin session requesting `/api/platform/*` receives `HTTP 404`.
- Break-glass test: Verify session token becomes invalid after 30 minutes.
- Provisioning test: Creating new tenant auto-generates default campus, session, and admin.

---

## 14. Acceptance Criteria
- [ ] Platform operator can provision school in < 60 seconds.
- [ ] Support impersonation writes operator ID and ticket number to audit table.
- [ ] Tenant suspension immediately blocks school admin logins with payment reminder banner.

---

## 15. Deployment Considerations
- Accessible via internal subdomain (`admin.rivo.school`) or route group `/platform`.

---

## 16. Completion Checklist
- [ ] `RIVO-PLT-001` completed.
- [ ] `RIVO-PLT-002` completed.
- [ ] `RIVO-PLT-003` completed.
- [ ] `RIVO-PLT-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Automated payment billing for school SaaS subscriptions (Stripe/Razorpay Subscriptions) is scheduled for Post-Launch Phase 6.

