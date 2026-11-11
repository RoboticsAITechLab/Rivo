---
name: database-integrity
description: Transactional consistency, double-entry financial integrity, race condition prevention, and immutable auditing in relational databases
version: 1.0.0
technologies:
  - PostgreSQL 15+ / 16+
  - Prisma ORM 6.x
  - ACID Transactions
sources:
  - https://www.postgresql.org/docs/current/tutorial-transactions.html
  - https://www.prisma.io/docs/concepts/components/prisma-client/transactions
  - https://martinfowler.com/eaaCatalog/money.html
verification_date: 2026-11-11
---

# Database & Financial Integrity Engineering Skill

## 1. Purpose & Scope
Essential patterns for zero-loss financial accounting, concurrent payment collection, race-condition elimination, immutable audit trails, and transactional invariants in SaaS databases.

## 2. Core Engineering Principles
1. **Double-Entry Financial Invariant**: Money must never be created or destroyed in memory. Every payment allocation must tie directly to an existing obligation. `SUM(PaymentAllocations) <= TotalAmountPaid` and `BalanceRemaining = ObligationAmount - ConcessionAmount - SUM(Allocations)`.
2. **Pessimistic Locking / Atomic Isolation for Concurrent Payments**: Node.js in-memory calculations without database-level concurrency protection allow race conditions where two simultaneous payment requests allocate the same pending balance twice (over-allocation). Always execute financial mutations within a strict transaction with serializable checks or pessimistic locking:
   ```sql
   SELECT * FROM "FeeObligation" WHERE id = $1 FOR UPDATE;
   ```
3. **Immutable Receipts and Sequences**: Receipt numbers must never have gaps or collisions. Use database-level sequence generators or atomic counters (`UPDATE "IdSequence" SET counter = counter + 1 RETURNING counter`) inside the payment transaction.
4. **Append-Only Audit Logs**: Financial reversals, concessions, and payments must write immutable audit log rows (`FeeAuditLog`). Never execute hard `DELETE` queries on financial records.
5. **Integer / Cent Representation**: Never store currency values as floating-point numbers (`Float`). Always use integer cents / paise or exact `Decimal(12, 2)` to eliminate IEEE-754 precision drift.

## 3. Recommended Implementation Patterns

### Concurrent Safe Payment Transaction
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock student's pending obligations to serialize concurrent payment requests
  const obligations = await tx.$queryRaw<FeeObligation[]>`
    SELECT * FROM "FeeObligation" 
    WHERE "studentId" = ${studentId} 
      AND "schoolId" = ${schoolId} 
      AND "status" != 'PAID'
    ORDER BY "dueDate" ASC
    FOR UPDATE
  `;

  // 2. Compute allocation against locked rows
  let unallocated = paymentAmount;
  for (const obl of obligations) {
    if (unallocated <= 0) break;
    const due = Number(obl.amount) - Number(obl.paidAmount) - Number(obl.concessionAmount);
    const toPay = Math.min(unallocated, due);
    
    // 3. Update obligation and create allocation
    await tx.feePaymentAllocation.create({
      data: { paymentId, obligationId: obl.id, amount: toPay }
    });
    await tx.feeObligation.update({
      where: { id: obl.id },
      data: { 
        paidAmount: { increment: toPay },
        status: (Number(obl.paidAmount) + toPay >= Number(obl.amount) - Number(obl.concessionAmount)) ? 'PAID' : 'PARTIAL'
      }
    });
    unallocated -= toPay;
  }
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 10000
});
```

## 4. Common Failure Patterns
- **Read-Modify-Write in Node.js Memory**: Fetching an obligation, adding amount in JS, and saving back via `update()` without a row lock, allowing concurrent requests to overwrite each other.
- **Unlinked Payments**: Creating a `FeePayment` record without creating corresponding `FeePaymentAllocation` records.
- **Missing Foreign Key Indexes**: Forgetting indexes on `schoolId`, `studentId`, `academicSessionId`, causing full table scans during transactions.

## 5. Production Readiness Checklist
- [ ] All financial operations execute inside `prisma.$transaction`.
- [ ] Concurrency protection (`FOR UPDATE` or optimistic version locking) active on payment allocation.
- [ ] Decimal or integer representation used for all monetary amounts.
- [ ] IdSequence counter increment is strictly serialized inside transaction.
- [ ] Audit logs captured for every payment, concession, and reversal.

