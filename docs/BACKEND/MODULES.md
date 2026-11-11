# Backend Domain Modules

> **Last Verified:** November 11, 2026  
> **Source Directory:** `apps/web/src/lib`  
> **Status:** Code-Verified Ground Truth

---

## 1. Domain Service Catalog

| Service Module | Source Files | Responsibilities & Invariants |
| :--- | :--- | :--- |
| **Authentication Core** | `lib/auth/session.ts`<br>`lib/auth/crypto.ts`<br>`lib/auth/authorize.ts` | Database-backed session creation, SHA-256 token hashing, Redis caching, Scrypt password verification, deterministic role hierarchy guard (`requireAuth`). |
| **MFA & Mobile OTP** | `lib/auth/mfa.ts`<br>`lib/auth/otp.ts` | RFC 6238 TOTP verification, AES-256-GCM encrypted secrets, 10 hashed single-use recovery codes, 6-digit phone/email OTP with 60s cooldown and 5 attempt lockouts. |
| **Role & Permission Service** | `lib/roles/role-service.ts`<br>`lib/roles/permissions-catalog.ts` | Manages relational `CustomRole` and `RolePermission` models, evaluates built-in role hierarchies, resolves custom permission overrides. |
| **Sensitive Field Encryption** | `lib/security/encryption.ts` | Authenticated AES-256-GCM field encryption (`enc:v1:<iv>:<tag>:<ciphertext>`) for Aadhaar, PAN, and KYC identifiers. Fails closed in production. |
| **Atomic ID Generator** | `lib/id-generator/index.ts` | Sequential counter sequences via PostgreSQL atomic upsert (`IdSequence`). Derives school prefixes, zero-padding, and two-tier cache (RAM + Redis). |
| **Fee Ledger & Payments** | `lib/fees/fee-plan-service.ts`<br>`lib/fees/fee-payment-service.ts` | Plan versioning and publication locks, obligation generation, double-entry payment allocation, non-overpayment guarantees, payment reversals. |
| **Fee PDF Engine** | `lib/fees/fee-pdf-service.ts` | Serverless A4 PDF receipt generation using `pdf-lib` in memory. Integrates school branding, student enrollment snapshot, and cancellation watermarks. |
| **Student Roll Balancing** | `lib/students/roll-number-service.ts` | Unicode NFC normalization, character-by-character sorting, secondary tie-breakers, `MANUAL` lock preservation, transactional rebalancing. |
| **Timetable Clash Engine** | `lib/timetable/conflict-engine.ts` | Real-world validation detecting teacher double-booking, cohort scheduling collisions, and physical venue collisions. |
| **Examination & Grading** | `lib/results/results-service.ts` | Mark validation, aggregate calculation, CBSE 8-band grading scale (`A1` to `E`), compartment evaluation, and official publication locking. |
| **Cloud Media Storage** | `lib/storage/azure-blob.ts`<br>`lib/storage/validation.ts` | Direct browser-to-Azure SAS tokens (15-min write-only), category quotas (2MB avatar, 3MB logo, 10MB doc), magic-byte signature validation. |
| **Settings Service** | `lib/settings/settings-service.ts` | Unified access and caching for category-based settings JSON stored in `SchoolSetting`. |
| **Audience Communication** | `lib/communication/communication-service.ts`<br>`lib/notices/notice-service.ts` | Dynamic audience resolution, notice broadcast lifecycle, unread tracking, and transactional email dispatch via Resend. |
| **Testing & Observability** | `lib/testing/auth-guard.ts`<br>`lib/testing/health-adapter.ts`<br>`lib/testing/complete-regression.ts` | Platform operator authorization guard, automated functional and regression test runners, system diagnostic adapters, credential sanitizers. |

---

## 2. Key Transactional Workflows (`prisma.$transaction`)

The domain services strictly wrap critical multi-table operations in atomic PostgreSQL transactions:

1. **`recordFeePayment` (`fee-payment-service.ts`):** Verifies dues $\rightarrow$ Inserts `FeePayment` $\rightarrow$ Increments receipt counter in `IdSequence` $\rightarrow$ Creates `FeePaymentAllocation` rows $\rightarrow$ Updates `FeeObligation` paid/balance amounts $\rightarrow$ Creates `FeeReceipt` $\rightarrow$ Writes `FeeAuditLog`.
2. **`reverseFeePayment` (`fee-payment-service.ts`):** Fetches allocations $\rightarrow$ Rolls back obligation balances $\rightarrow$ Flags payment as `REVERSED` $\rightarrow$ Cancels receipt $\rightarrow$ Records audit log.
3. **`executeRollNumberRebalance` (`roll-number-service.ts`):** Updates roll numbers across all students in a class/section in an atomic batch.
4. **`createStudentWithEnrollment` (`api/students/route.ts`):** Creates `Student`, `Parent`, `ParentStudent`, and `StudentEnrollment` atomically.
5. **`publishFeePlan` (`fee-plan-service.ts`):** Transitions plan to `ACTIVE`, version to `PUBLISHED`, locks version items from further edits, and logs audit record.

