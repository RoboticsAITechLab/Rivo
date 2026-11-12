# RIVO — Module 05: Fee Management & Financial Integrity

> **Document:** `MODULE_05_FEE_MANAGEMENT_FINANCIAL_INTEGRITY.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Financial Systems Architect & Database Lead | **Version:** 1.0.0-EXEC  

---

## 1. Module Objective
Establish a high-integrity, double-entry financial accounting and fee collection engine across School Admin and Parent clients, guaranteeing zero over-allocation, atomic pessimistic transaction locking, immutable PDF receipt generation, and auditable payment reversals.

---

## 2. Existing Implementation Status
- Fee plans, fee heads, and obligations implemented in `apps/web/src/lib/fees/fee-plan-service.ts`.
- Fee payment collection service implemented in `apps/web/src/lib/fees/fee-payment-service.ts`.
- Vector PDF receipt generator implemented in `apps/web/src/lib/fees/fee-pdf-service.ts`.
- Active critical flaw: Concurrency race condition in `fee-payment-service.ts` where obligations are queried without `FOR UPDATE` locks and sequence counters increment outside transactions (SEC-02).

---

## 3. Required Final Functionality
- Atomic payment collection with pessimistic `SELECT ... FOR UPDATE` row-level locks on `FeeObligation`.
- Sequence counters (`generateNextPaymentNumber`, `generateNextReceiptNumber`) executed strictly *inside* the transaction.
- Authoritative balance calculation: Client applications (Parent Mobile) NEVER calculate balances independently.
- Automated daily reconciliation cron job alerting on any payment-vs-allocation discrepancy.

---

## 4. Technical Requirements
- PostgreSQL ACID transactions via `prisma.$transaction(async (tx) => ...)`.
- Exact monetary precision: All currency amounts stored as `Decimal(12, 2)` or integer cents.
- In-memory vector PDF generation via `pdf-lib 1.17.1`.

---

## 5. Frontend Tasks
- Verify School Admin fee payment collection screen (`/school/fees/payments/new`) displays real-time pending balance and supports cash, cheque, bank transfer, and UPI modes.
- Wire Parent App Fee Ledger view (Module 09).

---

## 6. Backend Tasks
- `RIVO-SEC-002`: Rewrite `recordFeePayment` in `apps/web/src/lib/fees/fee-payment-service.ts` to wrap obligation queries with `FOR UPDATE` and move ID generation inside the transaction.
- `RIVO-OPS-004`: Implement daily financial reconciliation cron job at `apps/web/src/app/api/cron/reconcile-fees/route.ts`.

---

## 7. Database Tasks
- Verify models: `FeeHead`, `FeePlan`, `FeePlanItem`, `FeeInstallment`, `FeeObligation`, `FeePayment`, `FeePaymentAllocation`, `FeeReceipt`, `FeeAuditLog`, `IdSequence`.
- Enforce check constraint: `FeePaymentAllocation.allocatedAmount <= FeeObligation.netAmount`.

---

## 8. API Requirements
- `POST /api/fees/payments`: Records counter payment, returns receipt ID.
- `GET /api/fees/receipts/[id]/pdf`: Streams vector A4 PDF receipt binary (`application/pdf`).
- `POST /api/fees/payments/[id]/reverse`: Executes audited payment reversal, restoring obligation balances.

---

## 9. Security Requirements
- All mutations restricted to `ACCOUNTANT`, `SCHOOL_ADMIN`, or `SCHOOL_OWNER` roles.
- Payment reversals require mandatory text justification (`reversalReason`) and write immutable entries to `FeeAuditLog`.

---

## 10. UI/UX Requirements
- Currency formatted with Lakhs/Crores separators (e.g. `₹1,25,000.00`).
- Clear visual status badges: `PENDING` (gray), `PARTIALLY_PAID` (amber), `PAID` (green), `OVERDUE` (red).

---

## 11. Integration Dependencies
- Consumed by Parent Mobile App (Module 09) and Razorpay/Cashfree payment gateway webhooks.
- Connected to Azure Blob Storage for long-term receipt PDF archival.

---

## 12. Error and Edge-Case Handling
- Attempting to pay an amount greater than total outstanding dues throws `Overpayment is not permitted` (`HTTP 400`).
- Cheque bounce or reversal restores obligation status to `PARTIALLY_PAID` or `PENDING` without deleting original payment record.

---

## 13. Testing Strategy
- Concurrency simulation test: Fire 2 concurrent payment requests of $500 against single $500 obligation; verify exactly 1 succeeds.
- Reversal test: Verify reversal increments obligation balance and marks receipt `CANCELLED`.
- Sequence test: Verify sequence numbers increment without gaps or collisions under high concurrency.

---

## 14. Acceptance Criteria
- [ ] Zero duplicate allocations under concurrent payment simulation.
- [ ] Receipt numbers strictly monotonic with zero duplicate IDs.
- [ ] Daily reconciliation query returns 0 discrepancies across all schools.

---

## 15. Deployment Considerations
- Transaction timeout configured to 10 seconds (`timeout: 10000`) in Prisma options to prevent serverless deadlocks.

---

## 16. Completion Checklist
- [ ] `RIVO-SEC-002` completed.
- [ ] `RIVO-OPS-004` completed.

---

## 17. Known Risks and Unresolved Decisions
- Highly concurrent cashier operations during morning school rush require database connection pool tuning in PgBouncer (addressed in Module 14).
