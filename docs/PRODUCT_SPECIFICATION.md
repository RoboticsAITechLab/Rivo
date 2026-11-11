# RIVO — Product Specification

> **Last Verified:** November 11, 2026  
> **Status:** Code-Verified Specifications  
> **Source Modules:** `apps/web/src/app/(school)`, `apps/web/src/app/api`, `apps/web/src/lib`

---

## 1. School Governance & Tenant Onboarding

### 1.1 Tenant Setup & Administration
- **Signup Flow:** Self-service registration (`POST /api/auth/signup/admin`) atomically provisions a `School` tenant, creates the initial `User` with `DIRECTOR` role, creates `SchoolMembership`, establishes a default `Campus` (`Main Campus`), and seeds the initial `AcademicSession`.
- **School Profile:** Supports official school name, slug, legal registration code, affiliation board (CBSE, ICSE, State, IB, Cambridge), contact details, timezone, and fiscal calendar dates.
- **Branding Assets:** Upload and storage of school crest/logo, official institutional seal, authorized signature, document header banner, and footer notes. Stored via Azure Blob Storage (`rivo-public` container).

### 1.2 Academic Structure Specifications
- **Multi-Campus Support:** Institutions can define multiple physical branches (`Campus`). Classes, sections, rooms, and faculty can be campus-scoped or institution-wide.
- **Academic Sessions:** Defines institutional academic cycles (e.g., "2026-27") with start/end dates. Supports explicit activation (`makeCurrent`) which archives preceding active sessions.
- **Classes & Sections:** Standard grade tiers (Class 1 through 12, Pre-Primary) with sequential display orders and division sections (A, B, C) with configurable student capacity thresholds.
- **Senior Secondary Streams:** High-school academic tracks (Science, Commerce, Arts, Vocational) bound to specific class levels.
- **Subject Catalog:** Curricula definitions with unique subject codes. Note: Stored in PostgreSQL with `name` and `code`; categorizations (Core, Elective, Practical) are managed via settings.
- **Houses System:** Inter-school houses with name, code, theme color, and motto. Students can be bound to houses for extracurricular and sports tracking.
- **Room Registry:** Catalog of classrooms and examination halls with seating capacity dimensions, campus binding, and room numbers.

---

## 2. Student Information & Admission System

### 2.1 Sequential ID Auto-Generation
- **Mechanism:** Backed by PostgreSQL atomic counter sequences (`IdSequence`).
- **Configuration (`IdFormatConfig`):** Customizable school prefix (e.g. `GIS-`), optional 4-digit or 2-digit academic year inclusion (`2026-`), and customizable zero-padding (e.g. 3 digits $\rightarrow$ `001`).
- **Concurrency Safety:** Two-tier caching (in-memory + Redis) with database atomic upsert prevents duplicate admission numbers even during high-concurrency admission drives.

### 2.2 Admission Workspace Flow
- **6-Stage Intake Wizard:**
  1. Personal & Demographics: Legal student name, DOB, gender, blood group, nationality, religion, category, mother tongue.
  2. Guardian Details: Primary father, mother, or legal guardian details with contact phone and email.
  3. Academic Enrollment: Session selection, campus, class, section, admission date, and roll number mode (`AUTO` vs `MANUAL`).
  4. Documents & Photo: Student avatar upload (2MB max, magic-byte validated) and verification documents (Birth Certificate, Transfer Certificate).
  5. Custom Dynamic Fields: Tenant-configurable attributes (Transport route, medical conditions, previous school).
  6. Review & Submit: Atomic transactional persistence creating `Student`, `Parent`, `ParentStudent`, and `StudentEnrollment`.
- **Fuzzy Duplicate Detection:** In-browser and server-side engine flags potential duplicate admissions by cross-checking student legal name, date of birth, guardian phone, and email.

### 2.3 Alphabetical Roll Number Balancing Engine
- **Engine:** `apps/web/src/lib/students/roll-number-service.ts`.
- **Collation Logic:** Normalizes strings via Unicode NFC (`normalize('NFC')`) and executes character-by-character lexicographical sorting.
- **Deterministic Tie-Breakers:** Full Name $\rightarrow$ First Name $\rightarrow$ Last Name $\rightarrow$ Admission Number.
- **Manual Lock Preservation:** Students flagged with `rollNumberMode = 'MANUAL'` retain their custom assigned numbers; `AUTO` candidates are sequentially reallocated around them.

---

## 3. Faculty & Staff Management

### 3.1 Faculty Directory & Onboarding
- **Faculty Master (`Teacher`):** Linked to central `User` identity; tracks employee ID, designation, department, primary campus, qualifications, and date of joining.
- **Invitation System (`StaffInvitation`):** Administrators dispatch secure onboarding invitations via email (Resend). Generates 32-byte cryptographic token valid for 7 days. On acceptance, staff sets a password and activates membership.
- **Teacher Assignments (`TeacherAssignment`):** Binds faculty to specific classes, sections, and subjects. Supports designating primary "Class Teachers" with class-wide attendance authority.

### 3.2 Compliance & KYC Document Verification
- **Teacher Documents (`TeacherDocument`):** Onboarding uploads for Aadhaar card, PAN card, educational degrees, and background checks.
- **Field-Level Encryption:** Sensitive KYC identifiers are encrypted at rest using AES-256-GCM (`KYC_ENCRYPTION_KEY`).
- **Verification Workflow:** States: `PENDING` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `VERIFIED` or `REJECTED` (with mandatory administrative rejection reason).

### 3.3 Granular Permission Overrides
- **Custom Access Scopes:** Admins can override system roles per faculty member using `UserPermissionOverride` with explicit scopes: `SCHOOL`, `CAMPUS`, `ASSIGNED`, `OWN`.

---

## 4. Fee & Financial Ledger System

### 4.1 Fee Plans & Versioning
- **Fee Heads (`FeeHead`):** Ledger categories (Tuition Fee, Transport Fee, Lab Fee, Sports, Admission). Supports taxability and refundability flags.
- **Annual Plans (`FeePlan`):** Multi-installment fee structures targeting specific academic classes and sessions.
- **Version Immutability (`FeePlanVersion`):**
  - Draft plans (`DRAFT`) can be edited.
  - Published plans (`PUBLISHED`) become permanently immutable.
  - Updating a published plan branches a new draft version (e.g. `v2`), preserving historical ledger records.
- **Schedule Invariants:** Mathematical validation enforces: $\sum \text{Item Amounts} = \text{Total Amount} = \sum \text{Installment Amounts}$.

### 4.2 Obligation Materialization & Concessions
- **Batch Assignment:** Publishing and assigning a plan materializes individual `FeeObligation` records for each student installment.
- **Concessions & Scholarships:** Institutional fee discounts reduce net obligation. Concessions can be reversed atomically (`POST /api/fees/concessions/[id]/reverse`).

### 4.3 Payments Collection & Reversals
- **Payment Collection (`FeePayment`):**
  - Channels: Cash, Cheque, UPI, Bank Transfer, Demand Draft.
  - Allocation: Double-entry allocation (`FeePaymentAllocation`) across obligations using FIFO (oldest due first) or targeted selection.
  - Non-Overpayment Guard: Payments exceeding outstanding balances are strictly blocked.
- **Transactional Payment Reversals:**
  - When a payment is reversed (`POST /api/fees/payments/[id]/reverse`), the transaction marks payment as `REVERSED`, cancels the receipt, restores original obligation balances and statuses, and records an immutable audit log entry.
- **Official PDF Receipt Engine (`FeeReceipt`):**
  - Pure server-side JavaScript PDF rendering via `pdf-lib` (`fee-pdf-service.ts`).
  - Generates A4 receipts with school branding, student enrollment snapshot, itemized breakdown, payment method details, and optional cancellation watermarks.

---

## 5. Operations: Attendance, Timetable & Homework

### 5.1 Student Daily Attendance
- **Roster Register:** Attendance register header (`AttendanceRegister`) per class/section/date/subject with individual student marks (`AttendanceRecord`).
- **Statuses Supported:** `PRESENT`, `ABSENT`, `LATE`, `LEAVE`, `EXCUSED`.
- **Policy Enforcement:** Cutoff submission windows and previous-record editing locks enforced via institutional settings.

### 5.2 Conflict-Free Timetable
- **Weekly Matrix:** Visual timetable grid mapping classes, periods, teachers, subjects, and rooms.
- **Clash Engine:** Detects and blocks:
  1. Teacher double-booking (same teacher assigned to two classes simultaneously).
  2. Cohort collision (class/section assigned to two subjects simultaneously).
  3. Room collision (two classes assigned to the same physical room simultaneously).

### 5.3 Homework & Coursework
- **Assignment Distribution:** Teachers assign tasks targeting specific cohorts with submission due dates, rich text instructions, and file attachments.

---

## 6. Formal Examinations & Tabulation Results

### 6.1 Examination Term Lifecycle
- **Exam Cycles (`ExamTerm`):** Mid-term, final, unit tests.
- **Paper Definitions (`ExamPaper`):** Per-subject papers with maximum marks, passing marks, duration, and weightage.
- **Date-Sheet Scheduling (`ExamSchedule`):** Date, time slot, and examination room allocation with conflict checking.
- **Hall Tickets & Admit Cards:** Server-rendered printable admit cards with candidate details, exam schedule, room numbers, and instructions.

### 6.2 Score Entry & Calculation Engine
- **Marks Tabulation:** Teachers enter marks with boundary validation ($\text{Score} \le \text{MaxMarks}$) and absentee marking (`ABSENT`, `EXEMPT`).
- **Automated Calculation:** Evaluates aggregate total, percentage, GPA, and CBSE 8-band grades (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `D`, `E`).
- **Compartment Rule:** 1 failed subject results in `COMPARTMENT`; >1 failed subject results in `FAIL`.
- **Publication Lockdown:** Once published (`POST /api/results/publish`), marks are officially locked against modification.

