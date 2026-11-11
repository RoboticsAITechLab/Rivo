# RIVO — System Requirements Specification

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Requirements  
> **Classification:** Engineering & Institutional Compliance

---

## 1. Functional Requirements (FR)

### FR-1: Multi-Tenancy & Isolation
- **FR-1.1:** The system must strictly enforce tenant data isolation across all relational models. No user from School A shall access, view, or mutate data belonging to School B.
- **FR-1.2:** Database queries touching tenant entities must enforce `where: { schoolId }` or derive tenant context from a cryptographically verified session.

### FR-2: Identity, Access & Role Hierarchy
- **FR-2.1:** The system must provide role-based access control supporting 10 standard roles (`DIRECTOR`, `PRINCIPAL`, `ADMIN`, `TEACHER`, `FEE_MANAGER`, `STAFF`, `STUDENT`, `PARENT`, `SCHOOL_ADMIN`, `OWNER`).
- **FR-2.2:** `DIRECTOR` and `OWNER` roles must have unrestricted administrative authority. Operational roles (`PRINCIPAL`, `ADMIN`) must be blocked from modifying system security policies or custom role definitions.
- **FR-2.3:** Teachers must be restricted to their assigned cohorts (`ASSIGNED` scope) when viewing students, taking attendance, or entering marks.
- **FR-2.4:** The system must support optional Multi-Factor Authentication (TOTP via RFC 6238) with 10 hashed single-use recovery codes.

### FR-3: Financial Accounting & Fee Management
- **FR-3.1:** Fee plans must support multi-installment schedules where $\sum \text{Installments} = \text{Total Fee}$.
- **FR-3.2:** Published fee plans must be permanently immutable. Changes require creating a new draft version.
- **FR-3.3:** Payment collections must be recorded atomically with double-entry allocations against specific installment obligations.
- **FR-3.4:** Overpayments exceeding the outstanding net balance of an obligation must be rejected.
- **FR-3.5:** Payments must never be deleted; they may only be transactionally reversed with an auditable reason.
- **FR-3.6:** Fee receipts must be generated server-side as immutable vector A4 PDFs featuring sequential receipt numbers, school branding, and cancellation watermarks if reversed.

### FR-4: Academic Operations & Scheduling
- **FR-4.1:** The timetable scheduling engine must algorithmically detect and reject conflicts for: (1) teacher double-booking, (2) cohort overlapping, and (3) physical room double-booking.
- **FR-4.2:** Student roll numbers must be sequentially generated with support for automatic alphabetical collation (Unicode NFC) and preservation of manual overrides.
- **FR-4.3:** Examination cycles must support date-sheet scheduling, venue hall allocation, printable hall tickets, marks moderation, and grade publication lockdown.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Security & Cryptography
- **NFR-1.1:** Passwords must be hashed using `scrypt` with individual salt values.
- **NFR-1.2:** Session tokens must be cryptographically random 32-byte strings. Only SHA-256 hashes of tokens may be stored in databases or caches.
- **NFR-1.3:** Sensitive KYC attributes (Aadhaar, PAN, Voter ID) must be encrypted at rest using AES-256-GCM authenticated encryption (`KYC_ENCRYPTION_KEY`).
- **NFR-1.4:** Media uploads must validate file size (2MB avatar, 3MB logo, 10MB document) and verify magic-byte headers (JPEG, PNG, WebP, PDF) to prevent MIME-spoofing and stored XSS.

### NFR-2: Performance & Latency
- **NFR-2.1:** Standard authenticated API route handlers must respond within $< 200\text{ ms}$ under normal load.
- **NFR-2.2:** Database connection pooling must be utilized in serverless edge environments (Neon PgBouncer on port 6543) to prevent connection pool exhaustion.
- **NFR-2.3:** Session verification must leverage a two-tier cache (Upstash Redis + in-memory) to resolve sessions in $< 15\text{ ms}$.
- **NFR-2.4:** Composite indexes must be maintained on high-traffic tenant tables (`attendance_registers`, `student_enrollments`, `fee_obligations`, `timetable_slots`).

### NFR-3: Reliability & Data Integrity
- **NFR-3.1:** All multi-step transactional operations (fee payment, payment reversal, student admission, roll rebalancing, results calculation) must execute within atomic `prisma.$transaction()` blocks.
- **NFR-3.2:** Financial records (`FeeObligation`, `FeePayment`, `FeeReceipt`) and active student enrollments must enforce `onDelete: Restrict` in the database to prevent accidental cascading deletion.
- **NFR-3.3:** Distributed rate limiting must be enforced on authentication routes (`/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/parent/otp/*`) with strict fail-closed behavior in production.

### NFR-4: Browser Compatibility & Accessibility
- **NFR-4.1:** The web application must function seamlessly on modern evergreen browsers (Chrome, Edge, Safari, Firefox).
- **NFR-4.2:** UI components must support screen readers, keyboard navigation (`Cmd+K` command palette), and respect `@media (prefers-reduced-motion: reduce)`.

