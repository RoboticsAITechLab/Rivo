import * as React from 'react';
import { FinancialAmount } from './financial-amount';
import { FeeStatusBadge } from './fee-status-badge';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AllocationPreviewItem {
  id: string;
  title: string;
  dueDate: string | Date;
  netDue: number;
  currentPaid: number;
  currentBalance: number;
  appliedAmount: number;
  remainingBalance: number;
}

interface PaymentAllocationPreviewProps {
  items: AllocationPreviewItem[];
  paymentAmount: number;
  totalApplied: number;
  remainingUnallocated: number;
  className?: string;
}

export function PaymentAllocationPreview({
  items,
  paymentAmount,
  totalApplied,
  remainingUnallocated,
  className,
}: PaymentAllocationPreviewProps) {
  return (
    <div className={cn('rounded-lg border bg-card/60 p-4 shadow-2xs space-y-3', className)}>
      <div className="flex items-center justify-between border-b pb-2.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Authoritative Allocation Preview
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Strict oldest-due-first settlement sequence validated by backend engine
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-muted-foreground block">Total Payment</span>
          <FinancialAmount amount={paymentAmount} size="md" variant="default" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground text-left">
              <th className="pb-2 font-semibold">Obligation / Installment</th>
              <th className="pb-2 font-semibold">Due Date</th>
              <th className="pb-2 font-semibold text-right">Outstanding</th>
              <th className="pb-2 font-semibold text-right">Applied</th>
              <th className="pb-2 font-semibold text-right">New Balance</th>
              <th className="pb-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => {
              const isFullySettled = item.remainingBalance === 0;
              const isPartiallyPaid = item.appliedAmount > 0 && item.remainingBalance > 0;
              const status = isFullySettled ? 'PAID' : isPartiallyPaid ? 'PARTIALLY_PAID' : 'PENDING';

              return (
                <tr
                  key={item.id}
                  className={cn(
                    'transition-colors',
                    item.appliedAmount > 0 ? 'bg-primary/4 font-medium' : 'text-muted-foreground'
                  )}
                >
                  <td className="py-2.5 font-medium text-foreground">{item.title}</td>
                  <td className="py-2.5 font-mono text-[11px]">
                    {new Date(item.dueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    <FinancialAmount amount={item.currentBalance} size="sm" variant="muted" />
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    <FinancialAmount
                      amount={item.appliedAmount}
                      size="sm"
                      variant={item.appliedAmount > 0 ? 'success' : 'muted'}
                    />
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    <FinancialAmount amount={item.remainingBalance} size="sm" />
                  </td>
                  <td className="py-2.5 text-right">
                    <FeeStatusBadge status={status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3 text-xs bg-muted/20 p-2.5 rounded-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-muted-foreground">
            Total Allocated: <strong className="text-foreground">{totalApplied > 0 ? totalApplied.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0'}</strong>
          </span>
        </div>
        {remainingUnallocated > 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Overpayment / Excess: {remainingUnallocated.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </span>
        )}
      </div>
    </div>
  );
}
