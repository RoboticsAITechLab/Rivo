# Rivo Phase 2 — Fee Management: End-to-End Architectural Audit & Implementation Plan

**Audit Date:** October 10, 2026  
**Auditor Roles:** Senior SaaS Architect, Financial Systems Engineer, Security Engineer, Full-Stack Developer  
**System Under Audit:** Rivo School Management System (Fee Management Core, Parent Portal & Student Profile Subsystems)  
**Git Commit Baseline:** `c73d24188c44058c30014c14ac9661030d02ba4e` on branch `main`  
**Working Tree Status:** Clean (All role-invitation access tests passing 26/26, fee foundation tests passing 60/60)

---

## 1. Executive Summary

This comprehensive audit of Rivo's Fee Management module validates the operational reality of the financial ledger, student detail presentation, parent self-service visibility, receipt numbering engine, settings synchronization, and automated late fee enforcement.

### Key Audit Findings Summary

| ID | Module / Surface | Classification | Severity | Description |
| :--- | :--- | :--- | :--- | :--- |
| **FEE-01** | `tab-fees.tsx` | Confirmed Defect | **P2** | Status filter mismatch (`'SUCCESS'` vs `'COLLECTED'`) and field property mismatch (`o.amount` vs `o.netAmount`/`o.originalAmount`), causing paid amounts to display as ₹0 and full dues as outstanding. |
| **FEE-02** | Parent Portal | Not Implemented | **P1** | Parent portal lacks child fee obligation ledger, installment breakdown, and official receipt PDF download endpoints/UI. |
| **FEE-03** | ID Generator / Receipts | Confirmed Defect | **P2** | Receipt numbering generator (`generateNextReceiptNumber`) bypasses institutional `receiptPrefix` from `SchoolSetting` (`category: 'fees'`), hardcoding `config.studentPrefix-RCT-` instead. |
| **FEE-04** | PDF Service / Receipts | Confirmed Defect | **P2** | PDF receipt generator (`generateReceiptPdfBuffer`) ignores configured `receiptFooterNote` from `SchoolSetting`, rendering a hardcoded disclaimer. |
| **FEE-05** | Late Fee Workflow | Not Implemented / Infrastructure Blocked | **P2** | Late fee grace days and fine per day are stored in settings and installment models, but no background worker or idempotent scheduler is deployed in the serverless hosting environment. |
| **FEE-06** | Online Payment Gateway | Not Implemented / Business Blocked | **P1** | `allowOnlinePayments` exists as a settings toggle, but no live gateway (Razorpay/Stripe), webhook handler, signature verifier, or merchant credential store is configured. Live payments must remain disabled until an approved provider contract is finalized. |

---

## 2. Inventory & Architecture Map

### 2.1 Complete Fee Management Inventory

- **Core Ledger & Service Layer:**  
  - [fee-payment-service.ts](file:///d:/Rivo/apps/web/src/lib/fees/fee-payment-service.ts): Authoritative ledger, atomic payment recording, allocation cascade (oldest-due-first or explicit), payment reversal with audit log, mid-year concessions and reversals, receipt snapshots.
  - [fee-plan-service.ts](file:///d:/Rivo/apps/web/src/lib/fees/fee-plan-service.ts): Fee heads, fee plan structures, versioning, publishing locks, mass assignment to student enrollments.
  - [fee-pdf-service.ts](file:///d:/Rivo/apps/web/src/lib/fees/fee-pdf-service.ts): Pure server-side A4 PDF receipt generation via `pdf-lib` (zero headless browser dependency, serverless compatible).
  - [id-generator/index.ts](file:///d:/Rivo/apps/web/src/lib/id-generator/index.ts): Atomic sequence generation for fee plans (`generateNextFeePlanCode`), payments (`generateNextPaymentNumber`), and receipts (`generateNextReceiptNumber`).
  - [settings-service.ts](file:///d:/Rivo/apps/web/src/lib/settings/settings-service.ts): Reads and caches institutional fee configuration (`category: 'fees'`).

- **API Routes:**  
  - `GET /api/fees/obligations`: Returns authoritative student ledger summary, obligations, payments, and assignments via `getStudentFeeLedger`.
  - `GET /api/fees/payments` & `POST /api/fees/payments`: Query payment records and execute atomic payment collections (`recordFeePayment`).
  - `POST /api/fees/payments/[id]/reverse`: Reverses payment and allocations atomically.
  - `GET /api/fees/receipts/[id]/pdf`: Streams official PDF receipt binary.
  - `GET /api/parent/children`: Enumerates verified children linked to authenticated parent account.

- **Frontend Consuming Surfaces:**  
  - `apps/web/src/components/students/tabs/tab-fees.tsx`: Student Profile Fee Tab in School Admin console.
  - `apps/web/src/app/(school)/school/fees/`: Admin Fee Operations Dashboard, Fee Plans, Fee Heads, Student Fee Workspace, Receipt Management.
  - `apps/web/src/app/(parent)/parent/`: Parent Portal (currently houses Home, Notices, Results, Notifications, Profile; missing Fees).

### 2.2 Data-Flow & Authority Map

```
Admin / Parent UI
       │
       ▼ (HTTPS REST)
Route Handlers (/api/fees/*, /api/parent/*)
       │
       ▼ [requireAuth & Tenant Scope (schoolId)]
Service Layer (fee-payment-service.ts, fee-plan-service.ts)
       │
       ▼ [prisma.$transaction (Serializable/Atomic)]
Neon PostgreSQL Database (FeePlan, FeeInstallment, FeeObligation, FeePayment, FeeReceipt, FeeAuditLog)
       │
       ▼ (Immutable Snapshots / Signed PDF)
Downstream: Receipt PDF Generator (pdf-lib) / Parent Portal
```

**Authoritative Owner of Financial Balances:**  
`apps/web/src/lib/fees/fee-payment-service.ts` owns the authoritative calculation:
- `balanceAmount = netAmount - paidAmount`
- `netAmount = originalAmount - concessionAmount`
- `totalPaid` is derived strictly from non-reversed allocations and `COLLECTED` payment records.

---

## 3. Deep-Dive Audit Findings & Root Causes

### 3.1 Finding FEE-01: Student Fee Tab Status & Property Mismatch (`tab-fees.tsx`)
- **Severity:** P2 (High UX / Financial Display Defect)
- **Status:** Confirmed Defect
- **File Reference:** [apps/web/src/components/students/tabs/tab-fees.tsx](file:///d:/Rivo/apps/web/src/components/students/tabs/tab-fees.tsx#L60-L65)
- **Root Causes:**
  1. **Status Enum Mismatch:** Line 62 computes:  
     `const totalPaid = payments.filter((p) => p.status === 'SUCCESS').reduce(...)`  
     However, Prisma schema and `fee-payment-service.ts` define `FeePaymentStatus` as `COLLECTED` or `REVERSED`. Payments never have status `'SUCCESS'`. Consequently, `totalPaid` evaluated to `₹0` regardless of collections made.
  2. **Field Accessor Mismatch:** Line 60 computes:  
     `const totalAssigned = obligations.reduce((acc, o) => acc + Number(o.amount || 0), 0)`  
     And Line 192 renders: `{formatCurrency(Number(ob.amount))}`  
     In Prisma and API responses, `FeeObligation` contains `originalAmount`, `netAmount`, `paidAmount`, and `balanceAmount`; the property `amount` does not exist and evaluates to `undefined`, displaying `₹0`.
  3. **Disregard of Authoritative Server Summary:** `/api/fees/obligations?studentId=...` already returns the authoritative `summary` object from `getStudentFeeLedger`:
     ```json
     {
       "summary": {
         "totalOriginal": 60000,
         "totalConcessions": 5000,
         "totalNet": 55000,
         "totalPaid": 20000,
         "totalBalance": 35000
       }
     }
     ```
     The component disregarded this authoritative summary and attempted flawed client-side re-computation.

---

### 3.2 Finding FEE-02: Missing Parent Portal Fee Statement & Receipts
- **Severity:** P1 (Essential User Journey Missing)
- **Status:** Not Implemented
- **File Reference:** `apps/web/src/app/(parent)/parent/`
- **Root Cause:**
  - The parent portal currently contains routes for notices and exam results, but lacks fee obligations, installment schedules, payment histories, and receipt download capabilities.
  - While parents can log in and view their linked children through `GET /api/parent/children`, there is no endpoint `GET /api/parent/children/[id]/fees` or `GET /api/parent/children/[id]/receipts/[receiptId]/pdf` to securely serve fee records.
  - The navigation bar in `apps/web/src/app/(parent)/parent/layout.tsx` omits a "Fees" entry.

---

### 3.3 Finding FEE-03: Receipt Prefix Decoupling in ID Generator
- **Severity:** P2 (Institutional Branding Defect)
- **Status:** Confirmed Defect
- **File Reference:** [apps/web/src/lib/id-generator/index.ts](file:///d:/Rivo/apps/web/src/lib/id-generator/index.ts#L441-L473)
- **Root Cause:**
  - `generateNextReceiptNumber(schoolId, options)` reads `getIdFormatConfig(schoolId, client)` and formats numbers as:  
    `${config.studentPrefix}-RCT-${currentYear}-${paddedNumber}`
  - It does not consult `getFeeSettings(schoolId)`, which contains the user-configured `receiptPrefix` (defaulting to `'REC'`).
  - As a result, changing the fee receipt prefix in `Settings → Fees` had zero effect on generated receipts.

---

### 3.4 Finding FEE-04: Receipt Footer Note Disregarded in PDF Generator
- **Severity:** P2 (Document Customization Defect)
- **Status:** Confirmed Defect
- **File Reference:** [apps/web/src/lib/fees/fee-pdf-service.ts](file:///d:/Rivo/apps/web/src/lib/fees/fee-pdf-service.ts#L366-L386)
- **Root Cause:**
  - `generateReceiptPdfBuffer` accepts `ReceiptPdfData`, which lacked a `footerNote` property.
  - The PDF generator stamped a hardcoded string:  
    `"Note: This is an authoritative, digitally signed fee receipt."`
  - In `apps/web/src/app/api/fees/receipts/[id]/pdf/route.ts`, `getFeeSettings(auth.schoolId)` was not invoked, meaning institutional disclaimer or legal notes configured in settings were discarded.

---

### 3.5 Finding FEE-05: Late Fee Worker Absence
- **Severity:** P2 (Operational Workflow Gap)
- **Status:** Not Implemented / Infrastructure Blocked
- **File Reference:** `SchoolSetting` (`lateFeeGraceDays`, `lateFeeFinePerDay`), `FeeInstallment`
- **Root Cause & Business Policy Assessment:**
  - Late fee settings exist, but no background worker (e.g. BullMQ, AWS Lambda, or pg_cron) is scheduled.
  - In serverless hosting (Vercel), persistent long-running background daemon threads do not run.
  - Financial Policy Ambiguity: Imposing late fees can either:
    1. Dynamically append a late fee fine adjustment to the installment's `balanceAmount`.
    2. Create a separate, auditable `FeeObligation` of type `LATE_FEE`.
  - Per strict financial engineering principles, mutating historical installment amounts silently violates auditability. A separate `LATE_FEE` obligation or late adjustment line item is required.
  - Until an explicit policy and scheduled cron trigger (e.g., Vercel Cron or GitHub Action dispatch) are approved, executing mutations during development is prohibited.

---

### 3.6 Finding FEE-06: Online Payment Gateway Live Execution
- **Severity:** P1 (Integration Blocked)
- **Status:** Not Implemented / Business Blocked
- **File Reference:** `apps/web/src/lib/settings/settings-service.ts` (`allowOnlinePayments`)
- **Root Cause:**
  - The toggle `allowOnlinePayments` is stored in settings, but no payment gateway SDK (Razorpay, Stripe, PayU, Cashfree), merchant account credentials, webhook signature verification endpoint, or idempotency lock table exists.
  - Live payments require institutional merchant IDs and webhook secret keys. Creating mock checkout flows in production financial workflows is strictly forbidden.
  - Requirement: Keep online payments gated until the institution specifies the approved provider and credentials.

---

## 4. Settings-to-Runtime Dependency Matrix

| Setting Key | Authoritative Storage | Default | Backend Consumer | Frontend Consumer | Status / Gap |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `currency` | `SchoolSetting.fees.currency` | `'INR'` | `fee-pdf-service` (via `INR`) | Fee UI formatters | Synchronized |
| `currencySymbol` | `SchoolSetting.fees.currencySymbol` | `'₹'` | Ledger formats | Student tab, Fee pages | Synchronized |
| `receiptPrefix` | `SchoolSetting.fees.receiptPrefix` | `'REC'` | `id-generator/index.ts` | Settings UI | **Defect:** ID generator bypassed setting. Fixed in Stage C. |
| `receiptFooterNote`| `SchoolSetting.fees.receiptFooterNote`| `'This is a computer generated...'` | `fee-pdf-service.ts` | Settings UI | **Defect:** Hardcoded in PDF generator. Fixed in Stage C. |
| `lateFeeGraceDays`| `SchoolSetting.fees.lateFeeGraceDays` | `7` | None (worker absent) | Settings UI | Blocked by scheduler infrastructure. |
| `allowOnlinePayments`| `SchoolSetting.fees.allowOnlinePayments` | `true` | None (no gateway) | Settings UI | Gated until payment gateway contract approved. |
| `autoIssueReceipt` | `SchoolSetting.fees.autoIssueReceipt` | `true` | `recordFeePayment` | Settings UI | Receipts are issued upon payment collection. |

---

## 5. Security & Tenant Isolation Assessment

1. **Authentication & Role Authorization:**
   - Admin fee APIs require `permission: 'fees.view'`, `'fees.payment_record'`, `'fees.receipt_view'`.
   - Parent APIs must require role `'PARENT'` and enforce verified guardian-student relationship via `ParentStudent`.
2. **Tenant Boundary Protection:**
   - All queries filter strictly on `schoolId: auth.schoolId`.
   - Tests 40 & 41 in `fee-management-foundation.test.ts` prove School B receives HTTP 404/rejection when requesting School A payments or receipts.
3. **Parent Ownership Validation:**
   - Direct requests with arbitrary `studentId` or `receiptId` must verify that the requesting parent user is actively linked to the student in the database. Client-submitted student IDs must never be blindly trusted.
4. **Financial Immutability:**
   - Payment reversal marks records as `REVERSED` and receipts as `CANCELLED`; no physical `DELETE` operations occur in financial ledger tables.

---

## 6. Phased Remediation Plan

- **Stage A — Student Fee Tab Remediation:**
  - Update `apps/web/src/components/students/tabs/tab-fees.tsx` to handle `COLLECTED` payment status, use `netAmount`, `paidAmount`, and `balanceAmount`, and prefer the authoritative `summary` object from `getStudentFeeLedger`.
- **Stage B — Parent Portal Fee Statement & Receipts:**
  - Create secure backend route `GET /api/parent/children/[id]/fees` with guardian-child validation.
  - Create secure backend route `GET /api/parent/children/[id]/receipts/[receiptId]/pdf` with guardian-child validation.
  - Build responsive Parent Portal UI in `apps/web/src/app/(parent)/parent/fees/page.tsx` and add "Fees" to parent navigation.
- **Stage C — Receipt Settings Integration:**
  - Update `generateNextReceiptNumber` in `apps/web/src/lib/id-generator/index.ts` to respect `receiptPrefix` from `getFeeSettings`.
  - Update `ReceiptPdfData` in `apps/web/src/lib/fees/fee-pdf-service.ts` to accept `footerNote`.
  - In `apps/web/src/app/api/fees/receipts/[id]/pdf/route.ts`, pass `feeSettings.receiptFooterNote`.
- **Stage D & E — Late Fees & Online Payment Gateway:**
  - Document infrastructure requirements and business rules. Do not deploy unapproved background workers or live payment gateways.

---

## 7. Verification & Testing Strategy

1. Execute unit & integration regression tests covering:
   - Payment status calculation and summary reconciliation.
   - Parent authorization and cross-student access prevention.
   - Receipt prefix generation and PDF footer stamping.
2. Run full regression test suite (`fee-management-foundation.test.ts`).
3. Run role & invitation regression test suite (`role-invitation-access.test.ts`).
4. Validate TypeScript type-checking via `npx tsc --noEmit`.

---

## 8. Implementation & Verification Report

### 8.1 Remediation Actions & Changed Files

| ID | Module / Component | Severity | Final Status | Changes Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **FEE-01** | `tab-fees.tsx` | **P2** | **FIXED AND TESTED** | Reconciled summary with `getStudentFeeLedger`, filtered payments by `status === 'COLLECTED'`, added support for `REVERSED` badges, and corrected obligation amount accessors (`netAmount ?? originalAmount ?? amount`). |
| **FEE-02** | Parent Portal | **P1** | **FIXED AND TESTED** | Built `GET /api/parent/children/[id]/fees` with guardian-child validation, `GET /api/parent/children/[id]/receipts/[receiptId]/pdf` with receipt ownership checks, added "Fees" link in `parent/layout.tsx`, and authored reactive `(parent)/parent/fees/page.tsx`. |
| **FEE-03** | Receipt Numbering Prefix | **P2** | **FIXED AND TESTED** | Updated `generateNextReceiptNumber` in `id-generator/index.ts` to query `SchoolSetting` (`category: 'fees'`) and apply configured `receiptPrefix` while safely falling back to `'RCT'`. |
| **FEE-04** | Receipt Footer Note | **P2** | **FIXED AND TESTED** | Added `footerNote` to `ReceiptPdfData` in `fee-pdf-service.ts`, rendered the disclaimer in the footer block, and passed `feeSettings.receiptFooterNote` from both admin and parent receipt PDF routes. |
| **FEE-05** | Late Fee Background Worker | **P2** | **BLOCKED** | Settings persist safely. Execution requires background scheduling infrastructure (e.g. Vercel Cron / BullMQ worker) and institutional approval on whether late fees should append adjustments to existing obligations or issue distinct `LATE_FEE` line items. No speculative unapproved cron was deployed. |
| **FEE-06** | Online Payment Gateway | **P1** | **BLOCKED** | Settings toggle preserved. Live gateway integration is intentionally gated pending merchant provider selection, API credentials, and webhook infrastructure. No mock payments or fake credentials introduced. |

### 8.2 Changed Files Inventory

1. [apps/web/src/components/students/tabs/tab-fees.tsx](file:///d:/Rivo/apps/web/src/components/students/tabs/tab-fees.tsx):
   - Added authoritative `summary` state from `getStudentFeeLedger`.
   - Corrected payment status filter to `p.status === 'COLLECTED'` (and visual indicator for `'REVERSED'`).
   - Fixed obligation amount field lookup to use `netAmount`, `paidAmount`, and `balanceAmount`.
   - Fixed receipt ID links and receipt number displays.
2. [apps/web/src/app/(parent)/parent/layout.tsx](file:///d:/Rivo/apps/web/src/app/(parent)/parent/layout.tsx):
   - Added `{ label: 'Fees', href: '/parent/fees', icon: CreditCard }` to parent portal navigation.
3. [apps/web/src/app/(parent)/parent/fees/page.tsx](file:///d:/Rivo/apps/web/src/app/(parent)/parent/fees/page.tsx):
   - Created full-featured Parent Portal Fee Statement & Receipts view with child context switching, summary cards, installment breakdown, and PDF receipt downloads.
4. [apps/web/src/app/api/parent/children/[id]/fees/route.ts](file:///d:/Rivo/apps/web/src/app/api/parent/children/[id]/fees/route.ts):
   - Created parent fee statement endpoint verifying `ParentStudent` relationship and tenant isolation before returning ledger data.
5. [apps/web/src/app/api/parent/children/[id]/receipts/[receiptId]/pdf/route.ts](file:///d:/Rivo/apps/web/src/app/api/parent/children/[id]/receipts/[receiptId]/pdf/route.ts):
   - Created parent receipt download endpoint verifying `ParentStudent` and `FeeReceipt.studentId` ownership before streaming PDF binary.
6. [apps/web/src/lib/id-generator/index.ts](file:///d:/Rivo/apps/web/src/lib/id-generator/index.ts):
   - Connected `SchoolSetting` (`receiptPrefix`) to `generateNextReceiptNumber` with safe backward-compatible `'RCT'` fallback.
7. [apps/web/src/lib/fees/fee-pdf-service.ts](file:///d:/Rivo/apps/web/src/lib/fees/fee-pdf-service.ts):
   - Added `footerNote` to `ReceiptPdfData` and dynamically rendered institutional legal disclaimer in generated PDFs.
8. [apps/web/src/app/api/fees/receipts/[id]/pdf/route.ts](file:///d:/Rivo/apps/web/src/app/api/fees/receipts/[id]/pdf/route.ts):
   - Retrieved `getFeeSettings` and injected `receiptFooterNote` into administrative receipt PDF generation.
9. [apps/web/src/__tests__/parent-fee-access.test.ts](file:///d:/Rivo/apps/web/src/__tests__/parent-fee-access.test.ts):
   - Created 15 comprehensive regression tests covering parent fee access, guardian ownership verification, receipt prefix integration, PDF footer generation, and cross-tenant isolation.

### 8.3 Database & Migration Assessment
- **Schema Migrations Needed:** **NONE**.  
  The existing Prisma schema already contains `ParentStudent`, `FeeReceipt`, `FeeObligation`, `FeePayment`, and `SchoolSetting`. All features and security boundaries operate directly on existing production models without schema changes.

### 8.4 Test Execution Results

1. **Parent Fee Access & Security Regression Suite:**
   - Command: `npx tsx src/__tests__/parent-fee-access.test.ts`
   - Outcome: **15/15 Tests Passed (Exit Code 0)**
   - Coverage: Verified linked student fee retrieval, unlinked student access rejection (HTTP 403), receipt prefix generation (`DPS-RCT`), receipt ownership checks, tenant isolation, and PDF magic header `%PDF-`.
2. **Fee Management Foundation & Financial Integrity Suite:**
   - Command: `npx tsx src/__tests__/fee-management-foundation.test.ts`
   - Outcome: **60/60 Tests Passed (Exit Code 0)**
   - Coverage: Fee heads, schedule validation, versioning, publishing lock, EMI assignments, concessions, partial/full settlements, reversals, receipt snapshots, tenant isolation, and ledger reconciliation.
3. **Role-to-Invitation Access Integration Suite:**
   - Command: `npx tsx src/__tests__/role-invitation-access.test.ts`
   - Outcome: **26/26 Tests Passed (Exit Code 0)**
   - Coverage: Preserved all Invitation System improvements from Phase 1.
4. **TypeScript Type-Check:**
   - Command: `npx tsc --noEmit`
   - Outcome: **Zero Errors (Exit Code 0)**

### 8.5 Security & Tenant Isolation Verification
- **Verified:** Direct API calls to `/api/parent/children/[id]/fees` with a `studentId` not belonging to the parent's `ParentStudent` records are strictly rejected with HTTP 403.
- **Verified:** Direct API calls to download receipt PDFs for other students or schools are denied.
- **Verified:** No client-submitted payment success statuses or client-calculated balances are trusted; all balances are calculated server-side from non-reversed allocations in serializable database transactions.

### 8.6 Manual Smoke-Test Instructions

1. **Student Fee Tab Smoke Test:**
   - Navigate to `/school/students/[studentId]`.
   - Click on the **Fees** tab.
   - Verify that **Total Assigned**, **Concessions**, **Total Paid**, and **Outstanding Balance** match the authoritative numbers from the fee ledger.
   - Verify that recorded cash/UPI payments display as `COLLECTED` and show the correct receipt number link.
2. **Parent Portal Fee Smoke Test:**
   - Log in as a parent user at `/parent`.
   - In the top header navigation, click **Fees** (`/parent/fees`).
   - Switch between children using the child switcher in the header; verify the ledger updates to the selected child.
   - Check the installment breakdown table for term due dates, amounts, and status badges.
   - In the **Official Payment Receipts** section, click **Download Official PDF**. Verify that the downloaded PDF contains the school name, student snapshot, and custom footer disclaimer note.
3. **Receipt Prefix & Footer Test:**
   - Go to `/school/settings/fees`.
   - Modify the **Receipt Number Prefix** to e.g. `TEST-REC` and **Receipt Footer Note** to a custom disclaimer. Save settings.
   - Record a new payment or download a receipt PDF.
   - Verify the new receipt number contains `TEST-REC` and the PDF reflects the custom footer.

### 8.7 Summary by Priority

- **P0 Defects:** None identified in Fee Management.
- **P1 Defects:**
  - Missing Parent Portal Fee Visibility: **FIXED AND TESTED**.
  - Online Payment Gateway Integration: **BLOCKED** (Requires institutional provider selection and credentials).
- **P2 Defects:**
  - Student Fee Tab Payment Status Mismatch (`tab-fees.tsx`): **FIXED AND TESTED**.
  - Receipt Prefix Configuration Decoupling: **FIXED AND TESTED**.
  - Receipt Footer Configuration Decoupling: **FIXED AND TESTED**.
  - Late Fee Background Worker: **BLOCKED** (Requires scheduling worker infrastructure and policy decision).
- **P3 Defects:** None.

