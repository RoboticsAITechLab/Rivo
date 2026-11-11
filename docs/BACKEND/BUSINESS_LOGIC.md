# Backend Business Logic Engines

> **Last Verified:** November 11, 2026  
> **Source Directory:** `apps/web/src/lib`  
> **Status:** Code-Verified Ground Truth

---

## 1. Fee Management & Ledger Engine (`lib/fees`)

### 1.1 Invariants & Version Immutability
- **Schedule Mathematical Invariant:**
  $$\sum \text{Item Amounts} = \text{Plan Total Amount} = \sum \text{Installment Amounts}$$
- **Version Branching:**
  - A plan in `DRAFT` status allows mutable updates to line items and installments.
  - Calling `publishFeePlan` transitions the version to `PUBLISHED` and plan status to `ACTIVE`.
  - Once `PUBLISHED`, the version is permanently locked. Any subsequent structural edit calls `createNewPlanVersion`, creating a `v2` draft while keeping `v1` intact for historical records.

### 1.2 Payment Allocation & Non-Overpayment Invariant
- **Atomic Double-Entry Allocation:** When recording a payment (`recordFeePayment`), the system calculates allocations across pending obligations:
  $$\text{Allocation Amount} \le \text{Obligation Net Balance}$$
  $$\sum \text{Allocations} = \text{Payment Amount}$$
- Overpayments exceeding total student obligations are rejected with `HTTP 400 OVERPAYMENT_NOT_PERMITTED`.
- **Status Transitions:**
  - If $\text{Paid} = \text{Net}$: Obligation status becomes `PAID`.
  - If $0 < \text{Paid} < \text{Net}$: Obligation status becomes `PARTIALLY_PAID`.

### 1.3 Non-Destructive Payment Reversal
- Payments cannot be deleted from PostgreSQL.
- Reversing a payment (`reverseFeePayment`):
  1. Queries all associated `FeePaymentAllocation` records.
  2. Decrements `paidAmount` on each affected obligation and restores `balanceAmount`.
  3. Transitions obligation status back to `PENDING` or `PARTIALLY_PAID`.
  4. Marks `FeePayment.status = 'REVERSED'` with `reversalReason` and timestamp.
  5. Marks `FeeReceipt.status = 'CANCELLED'`.
  6. Writes an immutable audit entry into `FeeAuditLog`.

---

## 2. Alphabetical Roll Number Balancing Engine (`lib/students`)

- **Service:** `apps/web/src/lib/students/roll-number-service.ts`.
- **Algorithm:**
  1. Normalizes all student names using Unicode NFC normalization: `name.trim().normalize('NFC')`.
  2. Collates names using character-by-character lexicographical sorting.
  3. Applies deterministic tie-breakers: `Full Name` $\rightarrow$ `First Name` $\rightarrow$ `Last Name` $\rightarrow$ `Permanent Admission Number`.
  4. Preserves manual allocations: Students with `rollNumberMode = 'MANUAL'` retain their custom numbers without reassignment.
  5. Sequentially reallocates numbers $1, 2, 3, \dots, N$ to `AUTO` candidates around preserved manual numbers.
  6. Executes a two-step transactional update in PostgreSQL to eliminate unique constraint collisions during rebalancing.

---

## 3. Real-World Timetable Clash Engine (`lib/timetable`)

- **Service:** `apps/web/src/lib/timetable/conflict-engine.ts`.
- Evaluates multi-dimensional scheduling constraints before slot creation:
  1. **Teacher Double-Booking:** Checks whether `teacherId` is already allocated to any class/section in the same session on `dayOfWeek` during `periodNumber`.
  2. **Class Collision:** Checks whether the target `classId` and `sectionId` already have a timetable slot in the same period.
  3. **Room Collision:** Checks whether the target physical `roomNumber` on `campusId` is already occupied by another class.
- Rejects conflicting slots with descriptive HTTP 409 error payloads detailing conflicting entities.

---

## 4. Formal Examination Tabulation & Grading (`lib/results`)

- **Service:** `apps/web/src/lib/results/results-service.ts`.
- **Calculation Rules:**
  - Aggregates obtained marks across all subject papers in the term: $\text{Percentage} = \frac{\sum \text{Marks Obtained}}{\sum \text{Max Marks}} \times 100$.
  - Assigns CBSE 8-Band Grade:
    - $\ge 91\% \rightarrow \text{A1}$
    - $81\% - 90\% \rightarrow \text{A2}$
    - $71\% - 80\% \rightarrow \text{B1}$
    - $61\% - 70\% \rightarrow \text{B2}$
    - $51\% - 60\% \rightarrow \text{C1}$
    - $41\% - 50\% \rightarrow \text{C2}$
    - $33\% - 40\% \rightarrow \text{D}$
    - $< 33\% \rightarrow \text{E (Needs Improvement)}$
  - **Compartment Logic:**
    - 0 Failed Subjects $\rightarrow$ `PASS`.
    - 1 Failed Subject ($< 33\%$) $\rightarrow$ `COMPARTMENT`.
    - $> 1$ Failed Subjects $\rightarrow$ `FAIL`.
  - **Publication Lockdown:** Setting `status = 'PUBLISHED'` freezes marks from future modification by teachers.

